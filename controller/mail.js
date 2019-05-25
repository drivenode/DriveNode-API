const nodemailer = require("nodemailer");
const logHelper = require("./log");
const config = require("./config");

async function main(mailContentJson) {

    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let account = await nodemailer.createTestAccount();
    //account.user = config.getConfig.config.smtpUser;
    //account.pass = config.getConfig.config.smtpPassword
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: config.getConfig.config.smtpServer,
        port: config.getConfig.config.smtpPort,
        secure: false, // true for 465, false for other ports
        auth: {
            user: account.user, // generated ethereal user
            pass: account.pass// generated ethereal password
        }
    });

    // setup email data with unicode symbols
    /* Json Example
    let mailOptions = {
        from: '"Fred Foo" <foo@example.com>', // sender address
        to: "damonwcw@outlook.com, baz@example.com", // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello world?", // plain text body
        html: "<b>Hello world?</b>" // html body
    };
    */
    // send mail with defined transport object
    let info = await transporter.sendMail(mailContentJson)

    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    logHelper.jsonLogFileAsync("Mail sent to " + mailContentJson.to + " | From:" + mailContentJson.from)
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    //cb(null, { success: true, mailId: info.messageId })
}

//main().catch(console.error);
module.exports.SendEmail = main;