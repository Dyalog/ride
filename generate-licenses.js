const generateLicenses = function generateLicenses(file) {
  const checker = require('license-checker');
  const fs = require('fs');
  const path = require('path');
  function isMarkDown(filepath) {
    const filename = path.basename(filepath).toUpperCase();
    return filename === 'README.MD' || filename === 'README.MARKDOWN';
  }
  function copyLicense(item) {
    if (item.licenseFile && !isMarkDown(item.licenseFile)) {
      const licenseFile = fs.readFileSync(`${item.licenseFile}`, 'utf8');
      fs.appendFileSync(file, `\n\n${item.module} (${item.repository})\n`);
      fs.appendFileSync(file, '=========================================\n');
      fs.appendFileSync(file, licenseFile);
    }
  }
  function printLicenseDetails(licenses) {
    fs.appendFileSync(file, 'THIRD-PARTY SOFTWARE NOTICES AND INFORMATION\n\n');
    fs.appendFileSync(file, 'This project incorporates components from the projects listed below.\n');
    Object.keys(licenses).forEach((key) => {
      licenses[key].forEach(copyLicense);
    });
  }
  function copyLicenseToText(json) {
    const licenses = Object.keys(json).map((key) => {
      const obj = json[key];
      obj.module = key;
      return obj;
    })
      .filter((item) => !isMarkDown(item.licenseFile))
      .reduce(
        (r, v) => {
          (r[v.licenses] || (r[v.licenses] = [])).push(v);
          return r;
        },
        {},
      );
    printLicenseDetails(licenses);
  }
  checker.init(
    {
      start: '.',
      production: true,
      excludePrivatePackages: true,
    },
    (err, json) => {
      if (err) {
        throw err;
      } else {
        copyLicenseToText(json); // The sorted json data
      }
    },
  );
};
module.exports.generateLicenses = generateLicenses;
