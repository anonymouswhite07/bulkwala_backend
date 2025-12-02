import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import imagekit from "../utils/imagekit.js";
import { v4 as uuidv4 } from "uuid";
import { generateUniqueSlug } from "../utils/slug.js";
import slugify from "slugify";

const createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    price,
    stock,
    category,
    subcategory,
    tags = [],
    isActive = true,
    isFeatured = false,
    sku,
    color = [],
    genericName,
    countryOfOrigin = "India",
    manufacturerName,
    gstSlab = 18,
  } = req.body;

  // Validate required fields
  if (!title || !description || !price || !stock) {
    throw new ApiError(400, "Title, description, price, and stock are required");
  }

  // Auto-generate slug if not provided
  let slug = req.body.slug;
  if (!slug) {
    slug = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Validate category & subcategory existence
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) throw new ApiError(404, "Category not found");

  const childSubcategory = await Subcategory.findOne({
    _id: subcategory,
    parentCategory: category,
  });
  if (!childSubcategory) throw new ApiError(404, "Subcategory not found");

  //  Separate image & video files
  let imageUrls = [];
  let videoUrls = [];

  if (req.files) {
    // handle images
    if (req.files.images && req.files.images.length > 0) {
      const imgUploads = await Promise.all(
        req.files.images.map(async (file) => {
          const base64 = file.buffer.toString("base64");
          const fileData = `data:${file.mimetype};base64,${base64}`;
          const filename = `${Date.now()}_${uuidv4()}_${file.originalname}`;

          const result = await imagekit.upload({
            file: fileData,
            fileName: filename,
            folder: "products/images",
          });

          return result.url;
        })
      );
      imageUrls = imgUploads;
    }

    // handle videos (support multiple videos now)
    if (req.files.video && req.files.video.length > 0) {
      const videoUploads = await Promise.all(
        req.files.video.map(async (file) => {
          // size check: 150MB max
          const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150 MB
          if (file.size > MAX_VIDEO_SIZE) {
            throw new ApiError(400, "Video size must not exceed 150 MB");
          }

          const base64 = file.buffer.toString("base64");
          const fileData = `data:${file.mimetype};base64,${base64}`;
          const filename = `${Date.now()}_${uuidv4()}_${file.originalname}`;

          const result = await imagekit.upload({
            file: fileData,
            fileName: filename,
            folder: "products/videos",
          });

          return result.url;
        })
      );
      videoUrls = videoUploads;
    }
  }

  const product = await Product.create({
    title,
    slug,
    description,
    images: imageUrls,
    videos: videoUrls, // store all video URLs in array
    price,
    discountPrice: req.body.discountPrice,
    stock,
    category,
    subcategory,
    tags,
    isActive,
    isFeatured,
    sku,
    color,
    genericName,
    countryOfOrigin,
    manufacturerName,
    createdBy: req.user._id,
    gstSlab,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});

const getSingleProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isDeleted: false })
    .populate("category", "name slug")
    .populate("subcategory", "name slug");

  if (!product) throw new ApiError(404, "Product not found");

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    subcategory,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 10,
    sellerId,
  } = req.query;

  const filter = { isDeleted: false };

  // If admin/seller is logged in → show only their own products
  if (req.user && (req.user.role === "admin" || req.user.role === "seller")) {
    filter.createdBy = req.user._id;
  }

  // ✅ Category (ObjectId)
  if (category) filter.category = category;

  // ✅ Subcategory (supports both ObjectId & name)
  if (subcategory) {
    // If subcategory is not a valid ObjectId → treat it as name
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(subcategory);

    if (isObjectId) {
      filter.subcategory = subcategory;
    } else {
      const sub = await Subcategory.findOne({
        name: { $regex: new RegExp(subcategory, "i") },
        isDeleted: false,
      }).select("_id");

      if (sub) {
        filter.subcategory = sub._id;
      } else {
        // no subcategory match found — return empty response
        return res.status(200).json(
          new ApiResponse(
            200,
            {
              products: [],
              total: 0,
              page: Number(page),
              limit: Number(limit),
            },
            "No products found for given subcategory"
          )
        );
      }
    }
  }

  // ✅ Seller Filter
  if (sellerId) filter.createdBy = sellerId;

  // ✅ Price Range Filter
  if (minPrice || maxPrice) filter.price = {};
  if (minPrice) filter.price.$gte = Number(minPrice);
  if (maxPrice) filter.price.$lte = Number(maxPrice);

  // ✅ Search Filter
  if (search && search.trim() !== "") {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { tags: regex },
      { slug: regex },
    ];
  }

  // ✅ Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // ✅ Fetch Products
  const products = await Product.find(filter)
    .populate("category", "name slug")
    .populate("subcategory", "name slug")
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Product.countDocuments(filter);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { products, total, page: Number(page), limit: Number(limit) },
        "Products fetched successfully"
      )
    );
});

const updateProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const updates = req.body;

  const product = await Product.findOne({ slug, isDeleted: false });
  if (!product) throw new ApiError(404, "Product not found");

  //  Ownership check
  // Admin & Seller can ONLY edit their own products
  if (product.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own products");
  }

  //  Slug check
  if (updates.slug && updates.slug !== product.slug) {
    const slugExists = await Product.findOne({
      slug: updates.slug,
      isDeleted: false,
    });
    if (slugExists) throw new ApiError(400, "Slug already exists");
    product.slug = updates.slug;
  }

  //  SKU check
  if (updates.sku && updates.sku !== product.sku) {
    const skuExists = await Product.findOne({ sku: updates.sku });
    if (skuExists) throw new ApiError(400, "SKU already exists");
    product.sku = updates.sku;
  }

  // Category check
  if (updates.category) {
    const categoryExists = await Category.findOne({
      _id: updates.category,
      isDeleted: false,
    });
    if (!categoryExists) throw new ApiError(404, "Category not found");
    product.category = updates.category;
  }

  // Subcategory check
  if (updates.subcategory) {
    const subcategoryExists = await Subcategory.findOne({
      _id: updates.subcategory,
      isDeleted: false,
    });
    if (!subcategoryExists) throw new ApiError(404, "Subcategory not found");
    product.subcategory = updates.subcategory;
  }

  // Handle images
  let finalImages = product.images || [];

  // Remove selected images
  if (updates.imagesToRemove && Array.isArray(updates.imagesToRemove)) {
    finalImages = finalImages.filter(
      (img) => !updates.imagesToRemove.includes(img)
    );
  }

  // Keep explicitly passed existing images (if frontend sends them)
  if (updates.existingImages && Array.isArray(updates.existingImages)) {
    finalImages = updates.existingImages;
  }

  // Upload new images if any
  if (req.files?.images && req.files.images.length > 0) {
    const newImageUploads = await Promise.all(
      req.files.images.map(async (file) => {
        const base64 = file.buffer.toString("base64");
        const fileData = `data:${file.mimetype};base64,${base64}`;
        const filename = `${Date.now()}_${uuidv4()}_${file.originalname}`;

        const result = await imagekit.upload({
          file: fileData,
          fileName: filename,
          folder: "products/images",
        });
        return result.url;
      })
    );
    finalImages = [...finalImages, ...newImageUploads];
  }

  product.images = finalImages;

  // 🔹 Handle videos (support multiple videos)
  let finalVideos = product.videos || [];
  
  // Remove selected videos
  if (updates.videosToRemove && Array.isArray(updates.videosToRemove)) {
    finalVideos = finalVideos.filter(
      (vid) => !updates.videosToRemove.includes(vid)
    );
  }

  // Keep explicitly passed existing videos (if frontend sends them)
  if (updates.existingVideos && Array.isArray(updates.existingVideos)) {
    finalVideos = updates.existingVideos;
  }

  // Upload new videos if any
  if (req.files?.video && req.files.video.length > 0) {
    const newVideoUploads = await Promise.all(
      req.files.video.map(async (file) => {
        const MAX_VIDEO_SIZE = 150 * 1024 * 1024;
        if (file.size > MAX_VIDEO_SIZE) {
          throw new ApiError(400, "Video size must not exceed 150 MB");
        }

        const base64 = file.buffer.toString("base64");
        const fileData = `data:${file.mimetype};base64,${base64}`;
        const filename = `${Date.now()}_${uuidv4()}_${file.originalname}`;

        const result = await imagekit.upload({
          file: fileData,
          fileName: filename,
          folder: "products/videos",
        });

        return result.url;
      })
    );
    finalVideos = [...finalVideos, ...newVideoUploads];
  }

  product.videos = finalVideos;

  // 🔹 Update other fields
  const allowedFields = [
    "title",
    "description",
    "price",
    "discountPrice",
    "stock",
    "tags",
    "isActive",
    "isFeatured",
    "color",
    "genericName",
    "countryOfOrigin",
    "manufacturerName",
    "gstSlab",
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      // ✅ Force numeric conversion for numeric fields
      if (["price", "discountPrice", "stock", "gstSlab"].includes(field)) {
        product[field] = Number(String(updates[field]).replace("%", "")) || 0;
      } else {
        product[field] = updates[field];
      }
    }
  });

  // ✅ Ensure createdBy is always set (prevents validation error)
  if (!product.createdBy) {
    product.createdBy = req.user._id;
  }

  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully"));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isDeleted: false });
  if (!product) throw new ApiError(404, "Product not found or already deleted");

  //  Ownership check
  // Admin & Seller can ONLY delete their own products
  if (product.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own products");
  }

  product.isDeleted = true;
  product.deletedAt = new Date();
  product.deletedBy = req.user._id;
  await product.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Product deleted successfully (soft delete)")
    );
});

const restoreProduct = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug, isDeleted: true });
  if (!product) throw new ApiError(404, "Product not found or not deleted");

  product.isDeleted = false;
  product.deletedAt = null;
  product.deletedBy = null;
  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product restored successfully"));
});

export {
  createProduct,
  getSingleProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  restoreProduct,
};




