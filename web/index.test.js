const chai = require('chai');
const Browser = require('zombie');

chai.should();

// //////////////////////////////////////////////////////////////////////////////////////////////////////

describe('https://hello.anthrenijisanji.repl.co/', ()=>{
    Browser.localhost('hello.anthrenijisanji.repl.co:443', process.env.PORT);
    const browser = new Browser();
    browser.debug();

    context('when access to /', ()=>{
        before(async function(){
            this.timeout(10000);
            await browser.visit('/');
        });
        it('displays root-dom with links', ()=>{
            browser.assert.success();
            browser.html('#root').length.should.not.equal(0);
            browser.html('#root ul li a').length.should.not.equal(0);
        });
    });
    context('when access to /YoutubeLiveLength/', ()=>{
        before(async function(done){
            this.timeout(30000);
            await browser.visit('/');
            await browser.clickLink('にじさんじ Youtubeライブ配信時間');
        });
        it('displays root-dom', ()=>{
            browser.assert.success();
            browser.html('#root').length.should.not.equal(0);
        });
    });
});