import { minWidth, rssFeeds } from './config';
import { parse, HTMLElement } from 'node-html-parser';
const probe = require('probe-image-size');

let Parser = require('rss-parser');
let parser = new Parser();

// using https://github.com/nodeca/probe-image-size to determine image size without downloading images

// Create an array or class for the image list that can be sent to a renderer class

type ParsedResult = {
  rawAttrs: string;
  src: string;
  queryParams: string[];
  alt: string;
  title: string;
};

const parseImgRawAttrs = (image: HTMLElement | null): ParsedResult => {
  let parsedResult = {
    rawAttrs: '',
    src: '',
    queryParams: [''],
    alt: '',
    title: '',
  };

  if (image) {
    parsedResult.rawAttrs = image.rawAttrs;
    const splitAttrs = image.rawAttrs.split('"');
    // This will produce an array where the odd elements are property names and the even ones are the values
    for (let i = 1; i < splitAttrs.length; i += 2) {
      const tag = splitAttrs[i - 1].toLowerCase().replace(' ', '');
      const value = splitAttrs[i];

      if (tag && value) {
        switch (tag) {
          case 'src=':
            const queryStart = value.search('\\?');
            if (queryStart > 0) {
              parsedResult.src = value.substring(0, queryStart);
              parsedResult.queryParams = value
                .substring(queryStart + 1)
                .split('&amp;');
            }
            break;
          case 'alt=':
            parsedResult.alt = value;
            break;
          case 'title=':
            parsedResult.title = value;
        }
      }
    }
  }
  return parsedResult as ParsedResult;
};

(async () => {
  try {
    let feed = await parser.parseURL(rssFeeds[0]);
    feed.items.forEach(async (item: any) => {
      try {
        const root = parse(item.content);
        if (root) {
          const imgAttrs = parseImgRawAttrs(root.querySelector('img'));
          const fullSizeSrc = imgAttrs.src.replace('preview', 'i');
          const metaData = await probe(fullSizeSrc);
          if (metaData.wUnits === 'px' && metaData.width > minWidth) {
            console.log(metaData.url);
          }
        }
      } catch (err) {
        // Just keep swimming
      }
    });
  } catch (err) {
    console.error(err);
  }
})();
