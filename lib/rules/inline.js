// load modules
const _             = require('underscore');
const S             = require('string');
const url           = require('url');
const zlib          = require('zlib');
const async         = require('async');
const cheerio       = require ("cheerio");

// handle checking for the cache
module.exports = exports = function(payload, fn) {

  // get the data
  var data      = payload.getData();

  // get the content
  payload.getResponse(function(err, response) {

    // check for errors
    if(err) {

      // output the error
      payload.error('inline', 'Something went wrong while retrieving the page content', err);

      // done
      return fn(err);

    }

    // the content to use
    var content = null;

    // get the content
    if(response && 
        response.content) {

      // set the content
      content = response.content.text || response.content.body || '';

    }

    // sanity check for content
    if(S(content || '').isEmpty() === true) {

      // debugging
      payload.debug('inline', 'Skipping as content was empty');

      // finish the callback
      return fn(null);

    }

    // get the lines of the code block
    var lines = content.split('\n');

    // load a context for cheerio
    var $ = cheerio.load(content);

    // check all the inline styles blocks
    $('style,script').each(function(index, elm) {

      // get the body
      var tagname   = elm.name.toLowerCase();
      var body      = $(elm).html();
      var tag       = '';

      // get the key type
      if(tagname === 'script')
        tag = 'JS';
      else if(tagname == 'style')
        tag = 'CSS';
      else
        return;

      // sanity check
      if(S(body || '').isEmpty() === true) 
        return;

      // get the length of the block
      var len = Buffer.byteLength(body, 'utf8');

      // check if the length is defined
      if(len > 10 * 1024) {

        // get the length of code
        var blockLines  = body.split('\n');
        var maxLength   = 5;

        // get the current line
        var current     = lines.indexOf();

        // add the payload
        payload.addRule({

          message:      'Avoid large inlined Stylesheets and Javascript',
          key:          'inline',
          type:         'warning'

        }, {

          message:      'Inline ' + tag + ' was bigger than $kb, moving to a external file could save $ on caching',
          identifiers:  [ 10, Math.round(len/1024) + 'kb' ],
          code:         {

            start:    current,
            end:      current + blockLines.slice(0, 5).length,
            subject:  current,
            text:     blockLines.slice(0, 5)

          }

        })

      }

    });

    // done
    fn(null);

  });

};
