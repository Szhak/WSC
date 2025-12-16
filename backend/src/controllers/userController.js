const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ data: user });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getProfile };