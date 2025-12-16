const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')                 
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/^-+|-+$/g, '');
}

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { createdAt: 'asc' } });
    return res.json({ data: categories });
  } catch (error) {
    return next(error);
  }
};


const createCategory = async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    const generatedSlug = slug ? slugify(slug) : slugify(name);
    const existing = await prisma.category.findFirst({
      where: { OR: [ { name }, { slug: generatedSlug } ] }
    });
    if (existing) {
      return res.status(400).json({ error: 'Category name or slug already exists.' });
    }
    const category = await prisma.category.create({
      data: {
        name,
        slug: generatedSlug
      }
    });
    return res.status(201).json({ message: 'Category created successfully.', data: category });
  } catch (error) {
    return next(error);
  }
};
const deleteCategory = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid category id" });

    await prisma.book.updateMany({
      where: { categoryId: id },
      data: { categoryId: null }
    });

    await prisma.category.delete({
      where: { id }
    });

    return res.json({ message: "Category deleted successfully." });
  } catch (error) {
    return next(error);
  }
};


module.exports = { getCategories, createCategory, deleteCategory};