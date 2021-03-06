const config = require('../config');
const PostService = require('./PostService');
const UserService = require('./UserService');
const mailgun = require("mailgun-js");
const mg = mailgun({ apiKey: config.mail_apikey, domain: config.mail_domain });
const JSON2HTML = require('node-json2html');
const moment = require('moment');
const fs = require('fs');

class MailService {

    async sendMail(numDays) {
        const users = await this.getSubscribers(numDays);
        const posts = await this.getLatestPosts(numDays);

        if (users.length == 0 || posts.length == 0) return;

        fs.readFile('./mail/indexTop.html', 'utf8', (err1, top) => {
            if (err1) console.log(err1);
            fs.readFile('./mail/indexBottom.html', 'utf8', (err2, bottom) => {
                if (err2) console.log(err2);
                fs.readFile('./mail/postTemplate.html', 'utf8', (err3, postTemplate) => {
                    if (err3) console.log(err3);
                    const template = {'<>':'div','html':postTemplate};
                    const formattedPosts = JSON2HTML.transform(JSON.stringify(posts), template);
                    const data = {
                        from: `Galvatron <noreply@${config.mail_domain}>`,
                        to: users,
                        subject: "Your Weekly Galvatron Digest",
                        html: top.concat(formattedPosts, bottom),
                        'recipient-variables': '{}'
                    };
            
                    mg.messages().send(data, (error, body) => {
                        console.log(body);
                    });
                });
            });
        });
    }

    async getSubscribers(frequency) {
        const userService = new UserService();
        const users = await userService.getUsers(undefined, undefined, undefined, frequency);
        const userEmails = users.map((user) => user.email).join(', ');
        return userEmails;
    }

    async getLatestPosts(threshold) {
        const timestamp = moment().subtract(threshold, 'days').toDate();
        const postService = new PostService();
        const { posts } = await postService.getPosts(undefined, 20, undefined, undefined, undefined, true, false, timestamp);
        return posts;
    }

}

module.exports = MailService;
