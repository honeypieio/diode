var nodemailer = require("nodemailer");
var htmlToText = require("nodemailer-html-to-text").htmlToText;
var sanitizeHtml = require("sanitize-html");

var Mail = {};

if (process.env.NODE_ENV == "production") {
  Mail.memberSmtpConfig = {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: JSON.parse(process.env.MAIL_SECURE_BOOL),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  };
} else {
  Mail.memberSmtpConfig = {
    host: process.env.ETHEREAL_MAIL_HOST,
    port: process.env.ETHEREAL_MAIL_PORT,
    secure: JSON.parse(process.env.ETHEREAL_MAIL_SECURE_BOOL),
    auth: {
      user: process.env.ETHEREAL_MAIL_USER,
      pass: process.env.ETHEREAL_MAIL_PASS
    }
  };
}

Mail.supportSmtpConfig = Mail.memberSmtpConfig;

Mail.sendSupport = function(from_name, from_address, subject, html, callback) {
  html = sanitizeHtml(html);

  var message = {
    html: html,
    from: "Murakami Support <support@murakami.org.uk>",
    to: "Ross Hudson <hello@rosshudson.co.uk>",
    subject: subject
  };

  var transporter = nodemailer.createTransport(Mail.supportSmtpConfig);
  transporter.use("compile", htmlToText());
  transporter.sendMail(message, callback);
};

Mail.sendAutomated = function(mail_id, member_id, callback) {
  Members.getById(member_id, function(err, member) {
    WorkingGroups.getAll(function(err, working_groups) {
      if (err || !member[0]) throw err;

      Members.makeNice(member[0], working_groups, function(beautifulMember) {
        Settings.getEmailTemplateById(mail_id, function(err, template) {
          if (err || !template[0]) throw err;
          mail = template[0];

          if (mail.active) {
            mail.markup = sanitizeHtml(mail.markup);

            mail.markup = mail.markup
              .replace("|first_name|", beautifulMember.first_name.text)
              .replace("|last_name|", beautifulMember.last_name.text)
              .replace("|fullname|", beautifulMember.full_name.text)
              .replace(
                "|exp_date|",
                beautifulMember.current_exp_membership.text.nice
              )
              .replace("|membership_id|", beautifulMember.id.text);

            var message = {
              html: mail.markup,
              from: "Shrub Co-op <shrub@murakami.org.uk>",
              to:
                beautifulMember.full_name.text +
                " <" +
                beautifulMember.email.text +
                ">",
              subject: mail.subject
            };

            var transporter = nodemailer.createTransport(
              Mail.supportSmtpConfig
            );
            transporter.use("compile", htmlToText());
            transporter.sendMail(message, callback);
          } else {
            callback("Email template not active!", null);
          }
        });
      });
    });
  });
};

Mail.sendInvite = function(first_name, last_name, email, token, callback) {
  var html = `<p>Hey |first_name|!</p>
  <p>
    You've been invited to join Diode. Follow the link below to to activate your
    account. The link will expire in 24 hours.
  </p>
  <a href="|url|">|url|</a>`;
  html = html
    .replace(
      /\|url\|/g,
      process.env.PUBLIC_ADDRESS + "/invitation?token=" + token
    )
    .replace(/\|first_name\|/g, first_name)
    .replace(/\|last_name\|/g, last_name);
  var message = {
    html: html,
    from: "Diode <hello@diode.org.uk>",
    to: first_name + " " + last_name + " <" + email + ">",
    subject: "Invite To Join"
  };

  var transporter = nodemailer.createTransport(Mail.supportSmtpConfig);
  transporter.use("compile", htmlToText());
  transporter.sendMail(message, callback);
};

Mail.sendUsers = function(
  first_name,
  last_name,
  email,
  subject,
  html,
  callback
) {
  var message = {
    html: html,
    from: "Diode <hello@diode.org.uk>",
    to: first_name + " " + last_name + " <" + email + ">",
    subject: subject
  };

  var transporter = nodemailer.createTransport(Mail.supportSmtpConfig);
  transporter.use("compile", htmlToText());
  transporter.sendMail(message, callback);
};

module.exports = Mail;
