const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(email, link) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Подтверждение почты",
    html: `
      <h2>Подтвердите вашу почту</h2>
      <p>Нажмите на кнопку ниже:</p>

      <a href="${link}" 
         style="
           padding:10px 20px;
           background:#4CAF50;
           color:white;
           text-decoration:none;
           border-radius:5px;
         ">
         Подтвердить email
      </a>

      <p>Ссылка действует 1 час.</p>
    `,
  });
}

module.exports = { sendVerificationEmail };
