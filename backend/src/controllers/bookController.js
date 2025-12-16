const { PrismaClient } = require('@prisma/client');
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();


function deleteLocalCover(coverUrl) {
  try {
    if (!coverUrl) return;

    if (!coverUrl.startsWith("/uploads/")) return;

    const filePath = path.join(__dirname, "../../public", coverUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted cover:", filePath);
    }
  } catch (e) {
    console.error("deleteLocalCover error:", e.message);
  }
}



const listBooks = async (req, res, next) => {
  try {
    const {
      q, author, category, categoryId,
      minPrice, maxPrice, available,
      sortBy, order, page, limit
    } = req.query;

    const where = {};

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (author) {
      where.author = { contains: author, mode: 'insensitive' };
    }

    if (categoryId) {
      const id = parseInt(categoryId);
      if (!isNaN(id)) where.categoryId = id;
    } else if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      where.categoryId = cat ? cat.id : -1;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (available === 'true') {
      where.stock = { gt: 0 };
    }

    const take = parseInt(limit) || 100;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * take;

    const validSortFields = ['price', 'createdAt', 'rating'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order && order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { category: true },
        orderBy: { [sortField]: sortOrder },
        skip,
        take
      }),
      prisma.book.count({ where })
    ]);

    return res.json({ data: books, page: pageNum, total });
  } catch (error) {
    return next(error);
  }
};

const getBookById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid book id.' });

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: true,
      }
    });

    if (!book) return res.status(404).json({ error: 'Book not found.' });
    return res.json({ data: book });
  } catch (error) {
    return next(error);
  }
};

const createBook = async (req, res, next) => {
  try {
    const { title, author, description, price, stock, categoryId, categorySlug, rating, coverUrl: coverUrlFromBody } = req.body;

    if (!title || !author || !price || !stock) {
      return res.status(400).json({ error: 'Title, author, price and stock are required.' });
    }

    let resolvedCategoryId = null;
    if (categoryId) {
      const id = parseInt(categoryId);
      if (!isNaN(id)) resolvedCategoryId = id;
    } else if (categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) resolvedCategoryId = cat.id;
    }

    let coverUrl = coverUrlFromBody || null;

    if (req.file) {
      coverUrl = req.file.path.startsWith('http')
        ? req.file.path
        : `/uploads/${req.file.filename}`;
    }

    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        coverUrl,
        rating: rating ? parseFloat(rating) : undefined,
        categoryId: resolvedCategoryId
      },
      include: { category: true }
    });

    return res.status(201).json({ message: 'Book created successfully.', data: newBook });
  } catch (error) {
    return next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid book id." });
    }

    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Book not found." });
    }

    const { title, author, description, price, stock, categoryId, categorySlug, rating } = req.body;

    let resolvedCategoryId = existing.categoryId;
    if (categoryId) {
      const cid = parseInt(categoryId);
      if (!isNaN(cid)) resolvedCategoryId = cid;
    } else if (categorySlug) {
      const cat = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (cat) resolvedCategoryId = cat.id;
    }

    let coverUrl = req.body.coverUrl || existing.coverUrl;

    if (req.file) {
      deleteLocalCover(existing.coverUrl);

      coverUrl = req.file.path.startsWith("http")
        ? req.file.path
        : `/uploads/${req.file.filename}`;
    }

    const updated = await prisma.book.update({
      where: { id },
      data: {
        title: title || existing.title,
        author: author || existing.author,
        description: description !== undefined ? description : existing.description,
        price: price ? parseFloat(price) : existing.price,
        stock: stock ? parseInt(stock) : existing.stock,
        coverUrl,
        rating: rating ? parseFloat(rating) : existing.rating,
        categoryId: resolvedCategoryId,
      },
      include: { category: true },
    });

    return res.json({ message: "Book updated successfully.", data: updated });
  } catch (error) {
    return next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid book id." });
    }

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }

    deleteLocalCover(book.coverUrl);

    await prisma.book.delete({ where: { id } });
    return res.json({ message: "Book deleted successfully." });
  } catch (error) {
    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ error: "Cannot delete this book because it has purchase history." });
    }
    return next(error);
  }
};


const searchBooksFromGoogle = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing search query" });

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    const books = (data.items || []).map(item => {
      const info = item.volumeInfo || {};
      return {
        title: info.title || "",
        authors: info.authors || [],
        description: info.description || "",
        image: info.imageLinks?.thumbnail || "",
        isbn: info.industryIdentifiers?.[0]?.identifier || "",
        publishedDate: info.publishedDate || "",
      };
    });

    res.json({ books });
  } catch (err) {
    console.error("Google Books fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch books from Google" });
  }
};

module.exports = {
  listBooks,
  getBookById,
  createBook,
  searchBooksFromGoogle,
  updateBook,
  deleteBook
};
