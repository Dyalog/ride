const generateLicenses = function generateLicenses(file) {
  const checker = require('license-checker');
  const fs = require('fs');
  const path = require('path');
  checker.init(
    {
      start: ".",
      production: true,
      excludePrivatePackages: true,
    },
    function (err, json) {
      if (err) {
        console.log(err); //Handle error
      } else {
        copyLicenseToText(json); //The sorted json data
      }
    }
  );
  function copyLicenseToText(json) {
    const licenses = Object.keys(json).map((key) => {
      let obj = json[key];
      obj.module = key;
      return obj;
    })
    .filter(item => !isMarkDown(item.licenseFile))
    .reduce(
      (r, v) => ((r[v.licenses] || (r[v.licenses] = [])).push(v), r),
      {}
    );
    printLicenseSummary(licenses);
    printLicenseDetails(licenses);
  }
  function printLicenseSummary(licenses) {
    Object.keys(licenses).forEach((key) => {
      const items = licenses[key];
      fs.appendFileSync(file, "\n\n-------------------\n");
      fs.appendFileSync(file, `${key} - License Summary\n`);
      fs.appendFileSync(file, "--------------------\n\n");
      items.forEach(item => {
        fs.appendFileSync(file, `${item.module}\n`);
      });
    });
  }
  function printLicenseDetails(licenses) {
    Object.keys(licenses).forEach(function (key) {
      const items = licenses[key];
      fs.appendFileSync(file, "\n\n----------------------\n");
      fs.appendFileSync(file, `${key} - License Details \n`);
      fs.appendFileSync(file, "------------------------\n\n");
      items.forEach(copyLicense);
    });
  }
  function copyLicense(item) {
    try {
      if (item.licenseFile && !isMarkDown(item.licenseFile)) {
        const licenseFile = fs.readFileSync(`${item.licenseFile}`, "utf8");
        fs.appendFileSync(file, "\n\n----------------------\n");
        fs.appendFileSync(file, `${item.module} - ${item.licenses}\n`);
        fs.appendFileSync(file, "-----------------------\n\n");
        fs.appendFileSync(file, licenseFile);
      }
    } catch (err) {
      console.error(err);
    }
  }
  function isMarkDown(filepath) {
    const filename = path.basename(filepath).toUpperCase();
    return filename == "README.MD" || filename == "README.MARKDOWN";
  }
};
module.exports.generateLicenses = generateLicenses;