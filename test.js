import axios from 'axios';
import { JSDOM } from 'jsdom';
import { promises as fs } from 'fs';
import XLSX from 'xlsx';


const writeArrayToXLSX = (arrayData, xlsxFilePath) => {

  const worksheet = XLSX.utils.aoa_to_sheet(arrayData);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  XLSX.writeFile(workbook, xlsxFilePath);

  
  console.log("Масив записано в XLSX");
}

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
    if (!scriptElements) return;
    
    
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
      return result;
    } catch (error) {
      console.error('Помилка при отриманні данних за посиланням:', productLink, error);
      throw error;
    }
  }


 const jsonParse =  async() => {

    let csvData = [[
      'id',
      'drug_id',
      'drug_name',
      'drug_producer',
      'pharmacy_name',
      'price',
      'availability_status',
      'updated_at',
    ]];

    try {
      const jsonData = await fs.readFile('xmltojson.json', 'utf8');
      const jsObject = JSON.parse(jsonData);
      const linksArray = jsObject.urlset.url
      for (let index = 0; index < linksArray.length; index++) {
        const element = linksArray[index];
        const company = await getCompanyData(element.loc);

        if(!company) continue;

        csvData.push([
          company.name,
          company.address,
          company.phone,
          company.rating,
          company.priceRange,
          company.link,
          company.category,
        ])
  
        
      }
        
      
      writeArrayToXLSX(csvData, 'listKiev.xlsx')

    } catch (error) {
      throw error;
    }
  }

  jsonParse()