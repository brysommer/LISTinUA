import axios from 'axios';
import { JSDOM } from 'jsdom';
import { promises as fs } from 'fs';

const extractText = (url) => {
  const startIndex = url.indexOf('http://list.in.ua/') + 'http://list.in.ua/'.length;
  const endIndex = url.indexOf('/', startIndex);
  
  if (startIndex === -1 || endIndex === -1) {
      return 'не вказано';
  } else {
      const extractedText = url.substring(startIndex, endIndex);
      return isNaN(extractedText) ? extractedText : 'не вказано';
  }
}

const processProductElements = async (htmlString, productLink) => {
    const dom = new JSDOM(htmlString);
    const document = dom.window.document;
  
    const scriptElements = document.querySelectorAll('script[type="application/ld+json"]');
    
    for (const scriptElement of scriptElements) {

        const scriptText = scriptElement.textContent.trim();
        const objectData = JSON.parse(scriptText)
        if (objectData.hasOwnProperty("telephone")) {
    
            return {
                name: objectData?.name,
                address: objectData?.address[0]?.streetAddress,
                phone: objectData?.telephone,
                rating: objectData?.aggregateRating?.ratingValue || 'немає оцінки',
                priceRange: objectData?.priceRange,
                link: productLink,
                category: extractText(productLink)
            };
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return null;
  }
  
const getCompanyData = async(productLink) => {
    try {
      const response = await axios.get(productLink);
      const result = await processProductElements(response.data, productLink);
      console.log(result);
      return result;
    } catch (error) {
      console.error('Помилка при отриманні данних за посиланням:', productLink, error);
      throw error;
    }
  }


 const jsonParse =  async() => {
    try {
      const jsonData = await fs.readFile('xmltojson.json', 'utf8');
      const jsObject = JSON.parse(jsonData);
      const linksArray = jsObject.urlset.url
      for (let index = 0; index < linksArray.length; index++) {
        const element = linksArray[index];
        await getCompanyData(element.loc)
        
      }
    } catch (error) {
      throw error;
    }
  }

  jsonParse()