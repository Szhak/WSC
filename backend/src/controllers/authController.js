const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const prisma = new PrismaClient();

/*MAILER*/
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((err) => {
  if (err) console.error("SMTP VERIFY ERROR:", err);
  else console.log("SMTP READY");
});

async function sendMail({ to, subject, html }) {` `
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP is not configured. Email skipped.");
    return;
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/*REGISTER*/
const register = async (req, res, next) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    email = normalizeEmail(email);

    name = String(name).trim();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,              
        password: hashedPassword,
        role: 'USER'
      }
    });

    sendMail({
      to: user.email,
      subject: `Привет ${user.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Пока ${user.name}</h2>
        </div>
      `
    }).catch(err => console.error("WELCOME MAIL ERROR:", err));

    res.status(201).json({
      message: 'Registration successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: 'Email is already registered.' });
    }
    return next(error);
  }
};

/*LOGIN*/
const login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    email = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

/*FORGOT PASSWORD*/
const forgotPassword = async (req, res, next) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    email = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ message: "Если email зарегистрирован, письмо придёт." });
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt }
    });

    const link = `${process.env.APP_BASE_URL}/login.html?token=${token}`;

    await sendMail({
      to: user.email,
      subject: "Book Marketplace",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Сброс пароля</h2>
          <p>Нажми на ссылку, чтобы задать новый пароль:</p>
          <p><a href="${link}">${link}</a></p>
        </div>
      `
    });

    return res.json({ message: "Если email зарегистрирован, письмо придёт." });
  } catch (error) {
    return next(error);
  }
};

/*RESET PASSWORD*/
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "token and newPassword are required" });
    }

    const resetRow = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetRow) {
      return res.status(400).json({ error: "Token invalid or expired" });
    }

    if (resetRow.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetRow.id } });
      return res.status(400).json({ error: "Token expired" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: resetRow.userId },
      data: { password: hashed }
    });

    await prisma.passwordResetToken.delete({
      where: { id: resetRow.id }
    });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
