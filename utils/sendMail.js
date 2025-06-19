const nodemailer = require('nodemailer');
require('dotenv').config();

class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        });
    }

    async sendMail(to, subject, text, html) {
        const mailOptions = {
            from: "contact@ista-gm.net",
            to,
            subject,
            text,
            html
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.response);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async sendMailOTP(user, otp) {
        try {
            const { nom, post_nom, prenom, matricule, e_mail } = user;
            const innerHTML = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4CAF50;">Bonjour ${nom} ${prenom} ${post_nom},</h2>
                <p>Votre code OTP est : <strong>${otp}</strong></p>
                <p>Veuillez utiliser ce code pour compléter votre vérification.</p>
                <p>Si vous n'avez pas demandé cette vérification, veuillez ignorer cet e-mail.</p>
                <p>Merci,</p>
                <p>L'équipe de support, contact@ista-gm.net</p>
            </div>
            `;

            const mailOptions = {
                from: "contact@ista-gm.net",
                to: e_mail,
                subject: 'Your OTP Code',
                text: `Hello ${prenom} ${post_nom}, your OTP code is: ${otp}`,
                html: innerHTML
            };

            await this.sendMail(mailOptions.to, mailOptions.subject, mailOptions.text, mailOptions.html);

            console.log('OTP email sent successfully to:', e_mail);
            return { success: true, message: 'OTP email sent successfully' };
        } catch (error) {
            console.error('Error sending OTP email:', error);
            throw error;
            
        }
    }
}

const mailService = new MailService();
module.exports = mailService;
