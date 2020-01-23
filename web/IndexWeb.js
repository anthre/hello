const {Web} = require('./CommonWeb');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class IndexWeb extends Web {
    async render({req, originUrl}={}) {
        return toHtml(originUrl);
    }
}
assign(module.exports,{IndexWeb});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

const toHtml = (originUrl='')=>(`
<!DOCTYPE html>
<html>
    <head>
        <script src="${originUrl}/js/client.min.js"></script>
        <link href="${originUrl}/css/client.min.css" rel="stylesheet" type="text/css"/>
    </head>
    <body>
        <div id="root">
        </div>
        <script>
            render({originUrl:"${originUrl}"});
        </script>
    </body>
</html>
`);