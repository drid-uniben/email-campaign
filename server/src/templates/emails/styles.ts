export const commonStyles = `
body {
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    line-height: 1.55;
    color: #212121;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
}
.header {
    background: #071936; /* Dark Blue */
    color: #fff;
    padding: 24px 16px;
    text-align: center;
}
.content {
    padding: 15px;
    background-color: #ffffff;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.proposal-title {
    font-size: 18px;
    color: #071936; /* Dark Blue */
    padding: 10px;
    background-color: #E6F0FF; /* Soft Blue/Rose */
    border-left: 3px solid #071936; /* Dark Blue */
    margin: 15px 0;
}
.button {
    display: inline-block;
    padding: 10px 20px;
    background-color: #071936; /* Dark Blue */
    color: white !important;
    text-decoration: none;
    border-radius: 4px;
    margin: 15px 0;
    font-weight: bold;
}
.footer {
    background:#faf7f8;
    padding:16px;
    font-size:14px;
    color:#444;
    border-top:1px solid #D9E2EA; /* Light Grey/Blue */
    text-align: center;
}
.credentials {
    background-color: #E6F0FF; /* Soft Blue/Rose */
    padding: 15px;
    border-left: 3px solid #071936; /* Dark Blue */
    margin: 15px 0;
}`;

export const commonFooter = `
<div class="footer">
    <p>© ${new Date().getFullYear()} Admin Portal. All rights reserved.</p>
</div>`;
