const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'Rajeshsjk0@gmail.com',
		subject: 'Thanks for joining in!',
		text: `Hello ${name}, \n welcome to the app\nThanks,\nAdmin`,
	});
};

const sendCancelationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'Rajeshsjk0@gmail.com',
		subject: 'Thanks for your services',
		text: `Hello ${name}, \n It was nice having you around.if you have faced any difficulies from our side please let us know\nThanks,\nAdmin`,
	});
};

module.exports = {
	sendWelcomeEmail: sendWelcomeEmail,
	sendCancelationEmail, // since both property and value name are same
};
