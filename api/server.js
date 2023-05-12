const express = require("express");
const { curlContent, limitWords, ucwords } = require("./utils.js");
const { getImages, getSentences } = require("./scraper.js");
const app = express();
app.set("case sensitive routing", false);
app.disable("x-powered-by");
app.enable("trust proxy");

app.get("/ping", (req, res) => {
  res.header("content-type", "text/plain");
  res.write("ok");
  res.send();
});

app.get("/home.js", async (req, res) => {
  try {
    let query = req.query;
    let time = parseInt(query.t);
    let url = decodeURIComponent(query.v);
    url = new URL(url);
    let permalink = "/search/?q=";

    let settings = await curlContent(url.origin + "/settings.json");
    try {
      settings = JSON.parse(settings);
    } catch (e) {
      settings = [];
    }

    if (settings == "") {
      settings["meta-title"] = decodeURIComponent(query.ttl);
      settings["meta-description"] = decodeURIComponent(query.d);
      settings["meta-keyword"] =
        decodeURIComponent(query.ttl) + "," + decodeURIComponent(query.k);
      settings["author"] = decodeURIComponent(query.a);
      settings["main-keyword"] = decodeURIComponent(query.k);
      permalink = "/search?q=";
    }

    let next = 10;
    if (url.search == "") {
    } else {
      let n = url.search.split("?p=")[1];
      n = parseInt(n);
      if (n == 0) {
      } else {
        if (n < 11) {
          next = next * n;
        }
      }
    }
    let start = next - 10;

    let img = await getImages(limitWords(settings["main-keyword"], 6));
    let results = "";
    for (let i = start; i < next; i++) {
      if (img[i] != undefined) {
        img[i].title = decodeURIComponent(img[i].title);
        let ttl = img[i].title
          .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, " ")
          .replace(/\s\s+/g, " ");
        let link = ttl.replace(/\s/g, "+").toLowerCase();
        let data = `<div class="post-preview">
    <a href="${permalink + link}"><h2 class="post-title">${ucwords(
          ttl
        )}</h2></a><a href="${permalink + link}"><img class="img-fluid" src="${
          img[i].thumbnail
        }" alt="${ucwords(
          ttl
        )}" loading="lazy" onerror="this.onerror=null;this.src='https://tse1.mm.bing.net/th?q=${encodeURIComponent(
          ttl
        )}';" /></a><p class="post-meta">Posted by <a href="#" rel="nofollow">${
          settings["author"]
        }</a></p></div><hr class="my-4" />`;
        results += data;
      }
    }

    let meta = `<title>${
      settings["meta-title"]
    }</title><meta name="description" content="${
      settings["meta-description"]
    }" /><meta name="keywords" content="${
      settings["meta-keyword"]
    }" /><meta name="author" content="${
      settings["author"]
    }" /><meta property="og:locale" content="en_US" /><meta property="og:site_name" content="${
      settings["meta-title"]
    }" /><link rel="canonical" href="${
      url.href
    }" /><meta property="og:image" content="https://tse1.mm.bing.net/th?q=${encodeURIComponent(
      settings["main-keyword"]
    )}" /><meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1" /><meta property="og:type" content="website" /><meta property="og:title" content="${
      settings["meta-title"]
    }" /><meta property="og:description" content="${
      settings["meta-description"]
    }" /><meta property="og:url" content="${
      url.href
    }" /><meta name=\"twitter:card\" content=\"summary\" /><meta property="article:published_time" content="${new Date(
      time
    ).toISOString()}" /> <meta property="article:modified_time" content="${new Date(
      time
    ).toISOString()}" /><meta property="og:updated_time" content="${new Date(
      time
    ).toISOString()}" />`;

    res.header("content-type", "text/javascript");
    res.write(
      `document.querySelector("title").remove();var meta = ${JSON.stringify(
        meta
      )};document.querySelector("head").insertAdjacentHTML("beforeend", meta);\n`
    );
    res.write(
      `var title = document.querySelector("#title");var postTitle = document.querySelector("#postTitle");var postDesc = document.querySelector("#postDesc");var masthead = document.querySelector(".masthead");title.innerHTML = ${JSON.stringify(
        settings["meta-title"]
      )};postTitle.innerHTML = ${JSON.stringify(
        settings["meta-title"]
      )};postDesc.innerHTML = ${JSON.stringify(
        settings["meta-description"]
      )};masthead.setAttribute("style", "background-image: url('https://tse1.mm.bing.net/th?q=${encodeURIComponent(
        settings["main-keyword"]
      )}')")\n`
    );
    res.write(
      `var isPost = ${JSON.stringify(
        results
      )};document.querySelector("#isPost").insertAdjacentHTML("beforeend", isPost);`
    );
    res.write('document.querySelector(".preloader").remove();');
    res.send();
  } catch (e) {
    res.send("<center><h1>Jangan Lupa Sholat (^_^)</h1></center>");
  }
});

app.get("/post.js", async (req, res) => {
  try {
    let query = req.query;
    let time = parseInt(query.t);
    let url = decodeURIComponent(query.v);
    url = new URL(url);
    let permalink = "/search/?q=";
    // console.log(url);
    let kw = url.search.split("?q=")[1];
    kw = decodeURIComponent(kw).toLowerCase();
    try {
      kw = kw.replace(/\+/g, " ").replace(/\-/g, " ");
    } catch (e) {}

    let settings = await curlContent(url.origin + "/settings.json");
    try {
      settings = JSON.parse(settings);
    } catch (e) {
      settings = [];
    }

    if (settings == "") {
      settings["meta-title"] = decodeURIComponent(query.ttl);
      settings["meta-description"] = decodeURIComponent(query.d);
      settings["meta-keyword"] =
        decodeURIComponent(query.ttl) + "," + decodeURIComponent(query.k);
      settings["author"] = decodeURIComponent(query.a);
      settings["main-keyword"] = decodeURIComponent(query.k);
      permalink = "/search?q=";
    }

    let sugg = await suggest(kw, permalink);
    let img = await getImages(limitWords(kw, 6));
    let text = await getSentences(limitWords(kw, 6));

    let results = "";

    for (let i = 0; i < 20; i++) {
      let tt = img[i].title
        .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, " ")
        .replace(/\s\s+/g, " ");
      tt = ucwords(tt);
      if (text[i] == undefined) {
        text[i] = tt;
      }

      try {
        text[i] = decodeURIComponent(text[i]);
      } catch (e) {}

      if (i == 5) {
        results += `<h2 class="section-heading">${tt}</h2>`;
      }
      if (i == 10) {
        results += `<h3 class="section-heading">${tt}</h2>`;
      }
      if (i == 15) {
        results += `<h4 class="section-heading">${tt}</h2>`;
      }
      let content = `<p>${text[i]}</p><img class="img-fluid" src="${
        img[i].image
      }" alt="${tt}" onerror="this.onerror=null;this.src='https://tse1.mm.bing.net/th?q=${encodeURIComponent(
        tt
      )}';" loading="lazy" /><span class="caption text-muted">${tt}</span>`;
      results += content;
    }
    results += sugg;

    let ogImg = img[Math.floor(Math.random() * img.length)].image;
    let ttl = ucwords(kw) + " - " + settings["meta-title"];
    let desc = text[Math.floor(Math.random() * text.length)];
    desc = desc.replace(/<b>/g, "").replace(/<\/b>/g, "");

    let meta = `<title>${ttl}</title><meta name="description" content="${desc}" /><meta name="keywords" content="${kw}" /><meta name="author" content="${
      settings["author"]
    }" /><meta property="og:locale" content="en_US" /><meta property="og:site_name" content="${
      settings["meta-title"]
    }" /><link rel="canonical" href="${
      url.href
    }" /><meta property="og:image" content="${ogImg}" /><meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1" /><meta property="og:type" content="article" /><meta property="og:title" content="${ttl}" /><meta property="og:description" content="${desc}" /><meta property="og:url" content="${
      url.href
    }" /><meta name=\"twitter:card\" content=\"summary\" /><meta property="article:published_time" content="${new Date(
      time
    ).toISOString()}" /><meta property="article:modified_time" content="${new Date(
      time
    ).toISOString()}" /><meta property="og:updated_time" content="${new Date(
      time
    ).toISOString()}" />`;

    res.header("content-type", "text/javascript");
    res.write(
      `document.querySelector("title").remove();var meta = ${JSON.stringify(
        meta
      )};document.querySelector("head").insertAdjacentHTML("beforeend", meta);\n`
    );

    res.write(
      `var title = document.querySelector("#title");var postTitle = document.querySelector("#postTitle");var postDesc = document.querySelector("#postDesc");var masthead = document.querySelector(".masthead");title.innerHTML = ${JSON.stringify(
        settings["meta-title"]
      )};postTitle.innerHTML = ${JSON.stringify(
        ucwords(kw)
      )};postDesc.innerHTML = ${JSON.stringify(
        desc
      )};masthead.setAttribute("style", "background-image: url('https://tse1.mm.bing.net/th?q=${encodeURIComponent(
        kw
      )}')")\n`
    );

    res.write(
      `var content = ${JSON.stringify(
        results
      )};document.querySelector("#isContent").insertAdjacentHTML("beforeend", content);\n`
    );
    res.write('document.querySelector(".preloader").remove();');
    res.send();
  } catch (e) {
    res.send("<center><h1>Jangan Lupa Sholat (^_^)</h1></center>");
  }
});

async function suggest(query, permalink) {
  try {
    let url =
      "https://suggestqueries.google.com/complete/search?client=firefox&cp=2&hl=en&q=" +
      limitWords(query, 4);
    let response = await curlContent(url);
    response = JSON.parse(response)[1];

    if (response.length < 5) {
      let dataimg = await getImages(limitWords(query, 6));
      dataimg.forEach((e) => {
        response.push(e.title);
      });
    }

    let color = [
      "primary",
      "success",
      "danger",
      "warning",
      "info",
      "dark",
      "secondary",
    ];

    let dataSuggest = `<p><strong>People Also Ask:</strong><div class="list-group">`;
    for (let i = 1; i < 10; i++) {
      let clr = color[Math.floor(Math.random() * color.length)];
      if (response[i] != undefined) {
        response[i] = response[i]
          .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, " ")
          .replace(/\s\s+/g, " ");
        let link = response[i].replace(/\s/g, "+");
        let li = `<a href="${
          permalink + link.toLowerCase()
        }" class="list-group-item list-group-item-${clr}">${ucwords(
          response[i]
        )}</a>`;
        dataSuggest += li;
      }
    }
    dataSuggest += "</div></p>";
    return new Promise((resolve, reject) => {
      if (response == "") {
        resolve("");
      } else {
        resolve(dataSuggest);
      }
    });
  } catch (e) {}
}

app.get("/contact.js", async (req, res) => {
  try {
    let query = req.query;
    let time = parseInt(query.t);
    let url = decodeURIComponent(query.v);
    url = new URL(url);
    let permalink = "/search/?q=";
    // console.log(url);
    let kw = url.search.split("?q=")[1];
    kw = decodeURIComponent(kw).toLowerCase();
    try {
      kw = kw.replace(/\+/g, " ").replace(/\-/g, " ");
    } catch (e) {}

    let settings = await curlContent(url.origin + "/settings.json");
    try {
      settings = JSON.parse(settings);
    } catch (e) {
      settings = [];
    }

    if (settings == "") {
      settings["meta-title"] = decodeURIComponent(query.ttl);
      settings["meta-description"] = decodeURIComponent(query.d);
      settings["meta-keyword"] =
        decodeURIComponent(query.ttl) + "," + decodeURIComponent(query.k);
      settings["author"] = decodeURIComponent(query.a);
      settings["main-keyword"] = decodeURIComponent(query.k);
      permalink = "/search?q=";
    }

    let meta = `<title>Contact Us - ${settings["meta-title"]}</title><meta name="description" content="Contact for ${settings["meta-title"]}" />`;

    let results = `<p>Want to get in touch? Fill out the form below to send me a message and I will get back to you as soon as possible! </p><div class="my-5"> <form id="contactForm" data-sb-form-api-token="API_TOKEN"> <div class="form-floating"> <input class="form-control" id="name" type="text" placeholder="Enter your name..." data-sb-validations="required"/> <label for="name">Name</label> <div class="invalid-feedback" data-sb-feedback="name:required" > A name is required. </div></div><div class="form-floating"> <input class="form-control" id="email" type="email" placeholder="Enter your email..." data-sb-validations="required,email"/> <label for="email">Email address</label> <div class="invalid-feedback" data-sb-feedback="email:required" > An email is required. </div><div class="invalid-feedback" data-sb-feedback="email:email"> Email is not valid. </div></div><div class="form-floating"> <input class="form-control" id="phone" type="tel" placeholder="Enter your phone number..." data-sb-validations="required"/> <label for="phone">Phone Number</label> <div class="invalid-feedback" data-sb-feedback="phone:required" > A phone number is required. </div></div><div class="form-floating"> <textarea class="form-control" id="message" placeholder="Enter your message here..." style="height: 12rem" data-sb-validations="required" ></textarea> <label for="message">Message</label> <div class="invalid-feedback" data-sb-feedback="message:required" > A message is required. </div></div><br/> <div class="d-none" id="submitSuccessMessage"> <div class="text-center mb-3"> <div class="fw-bolder">Form submission successful!</div></div></div><div class="d-none" id="submitErrorMessage"> <div class="text-center text-danger mb-3"> Error sending message! </div></div><button class="btn btn-primary text-uppercase" onclick="submitBtn()" type="button" > Send </button> </form> </div>`;

    res.header("content-type", "text/javascript");
    res.write(
      `document.querySelector("title").remove();\nvar meta = ${JSON.stringify(
        meta
      )};document.querySelector("head").insertAdjacentHTML("beforeend", meta);\n`
    );

    res.write(
      `var title = document.querySelector("#title");var postTitle = document.querySelector("#postTitle");title.innerHTML = ${JSON.stringify(
        settings["meta-title"]
      )};postTitle.innerHTML = "Contact Us";\n`
    );

    res.write(
      `var content = ${JSON.stringify(
        results
      )};document.querySelector("#isPage").insertAdjacentHTML("beforeend", content);document.querySelector(".preloader").remove();`
    );

    res.write(
      `var soc = document.createElement("script");soc.innerHTML = "function submitBtn() { var scc = document.querySelector('#submitSuccessMessage');scc.setAttribute('class','d-show'); }";document.body.appendChild(soc);`
    );

    res.send();
  } catch (e) {}
});

app.get("/copyright.js", async (req, res) => {
  try {
    let query = req.query;
    let time = parseInt(query.t);
    let url = decodeURIComponent(query.v);
    url = new URL(url);
    let permalink = "/search/?q=";
    // console.log(url);
    let kw = url.search.split("?q=")[1];
    kw = decodeURIComponent(kw).toLowerCase();
    try {
      kw = kw.replace(/\+/g, " ").replace(/\-/g, " ");
    } catch (e) {}

    let settings = await curlContent(url.origin + "/settings.json");
    try {
      settings = JSON.parse(settings);
    } catch (e) {
      settings = [];
    }

    if (settings == "") {
      settings["meta-title"] = decodeURIComponent(query.ttl);
      settings["meta-description"] = decodeURIComponent(query.d);
      settings["meta-keyword"] =
        decodeURIComponent(query.ttl) + "," + decodeURIComponent(query.k);
      settings["author"] = decodeURIComponent(query.a);
      settings["main-keyword"] = decodeURIComponent(query.k);
      permalink = "/search?q=";
    }

    let meta = `<title>Copyright - ${settings["meta-title"]}</title><meta name="description" content="Copyright for ${settings["meta-title"]}" />`;

    let results = `<p style="text-align: justify"> <strong >Digital Millennium Copyright Act Notification Guidelines</strong > </p><p style="text-align: justify"> All images displayed on this site are copyrighted to their respective owners/uploaders. This site policy is to remove all images that violate copyrights. Please <a href="/search?q=contact_page">contact us</a> to request that images be removed or to assign proper credit. The images displayed on this site may be used for Free or educational purposes only. If you would like to use any of the images displayed on this site for any other purpose, please obtain permission from the owner. this site does not have the rights to give you such permission. By submitting Picture(s)to this site you agree that you have permission from the owner to use his/her picture(s) in your picture(s), or you own the rights yourself to the picture(s) that is(are) used in the picture(s)/photo(s) you submit. All images in this site are taken from public forum and user submit. </p><p> “ Disclaimer : this site consists of a compilation of public information available on the internet. The Photo file [TITLE] Collected from multiple source in internet. We are NOT affiliated with the publisher of this part, and we take no responsibility for material inside this part. ” </p><p style="text-align: justify"> It is our policy to respond to clear notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act. In addition, we will promptly terminate without notice the accounts of those determined by us to be “repeat infringers”. this site will respond expeditiously to claims of copyright infringement that are reported to this site. </p><p style="text-align: justify"> If you are a copyright owner, or are authorized to act on behalf of an owner of the copyright or of any exclusive right under the copyright, and believe that your work has been copied in a way that constitutes copyright infringement, please report your notice of infringement to this site by providing all the necessary information through the <a href="/search?q=contact_page">Contact Page</a>. </p>`;

    res.header("content-type", "text/javascript");
    res.write(
      `document.querySelector("title").remove();\nvar meta = ${JSON.stringify(
        meta
      )};document.querySelector("head").insertAdjacentHTML("beforeend", meta);\n`
    );

    res.write(
      `var title = document.querySelector("#title");var postTitle = document.querySelector("#postTitle");title.innerHTML = ${JSON.stringify(
        settings["meta-title"]
      )};postTitle.innerHTML = "Copyright";\n`
    );

    res.write(
      `var content = ${JSON.stringify(
        results
      )};document.querySelector("#isPage").insertAdjacentHTML("beforeend", content);document.querySelector(".preloader").remove();`
    );

    res.send();
  } catch (e) {}
});

app.get("/dmca.js", async (req, res) => {
  try {
    let query = req.query;
    let time = parseInt(query.t);
    let url = decodeURIComponent(query.v);
    url = new URL(url);
    let permalink = "/search/?q=";
    // console.log(url);
    let kw = url.search.split("?q=")[1];
    kw = decodeURIComponent(kw).toLowerCase();
    try {
      kw = kw.replace(/\+/g, " ").replace(/\-/g, " ");
    } catch (e) {}

    let settings = await curlContent(url.origin + "/settings.json");
    try {
      settings = JSON.parse(settings);
    } catch (e) {
      settings = [];
    }

    if (settings == "") {
      settings["meta-title"] = decodeURIComponent(query.ttl);
      settings["meta-description"] = decodeURIComponent(query.d);
      settings["meta-keyword"] =
        decodeURIComponent(query.ttl) + "," + decodeURIComponent(query.k);
      settings["author"] = decodeURIComponent(query.a);
      settings["main-keyword"] = decodeURIComponent(query.k);
      permalink = "/search?q=";
    }

    let meta = `<title>DMCA - ${settings["meta-title"]}</title><meta name="description" content="DMCA for ${settings["meta-title"]}" />`;

    let results = `<p style="text-align: justify"> <strong>Notification of Copyright Infringement</strong> </p><p style="text-align: justify"> We respect the intellectual property rights of others and expects our users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at <a title="DMCA" href="http://www.copyright.gov/legislation/dmca.pdf" >www.copyright.gov/legislation/dmca.pdf</a >, we will respond expeditiously to claims of copyright infringement committed using our service that are reported to our Designated Copyright Agent identified in the sample notice below. </p><p style="text-align: justify"> If you are a copyright owner, or are authorized to act on behalf of one or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the site and service (collectively the “Service”) by completing the following DMCA Notice of Alleged Infringement and delivering it to our Designated Copyright Agent. </p><p style="text-align: justify"> Upon receipt of Notice as described below, our Designated Copyright Agent will take whatever action, in its sole discretion, it deems appropriate, including removal of the challenged use from the Service and/or termination of the user’s account in appropriate circumstances. </p><p style="text-align: justify"> <strong>DMCA Notice of Alleged Infringement (“Notice”)</strong> </p><ul style="text-align: justify"> <li> Identify the copyrighted work that you claim has been infringed, or – if multiple copyrighted works are covered by this Notice – you may provide a representative list of the copyrighted works that you claim have been infringed. </li><li> Identify the material or link you claim is infringing (or the subject of infringing activity) and that access to which is to be disabled, including at a minimum, if applicable, the URL of the link shown on the Service where such material may be found. </li><li> Provide your mailing address, telephone number, and, if available, email address. </li><li> Include both of the following statements in the body of the Notice: <ul> <li> “I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use).” </li><li> “I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed.” </li></ul> </li><li> Provide your full legal name and your electronic or physical signature. </li></ul> <p style="text-align: justify"> Deliver this Notice, with all items completed, to our Designated Copyright Agent: Copyright Agent this site DMCA Division. </p><p style="text-align: justify"> <strong>Counter Notices</strong><br/>One who has posted material that allegedly infringes a copyright may send our Designated Copyright Agent a counter notice pursuant to Sections 512(g)(2) and 512(g)(3) of the DMCA. When our Designated Copyright Agent receives a counter notice, it may in its discretion reinstate the material in question in not less than 10 nor more than 14 days after it receives the counter notice unless it first receive notice from the copyright claimant that they have filed a legal action to restrain the allegedly infringing activity. </p><p style="text-align: justify"> To provide a counter notice to our Designated Copyright Agent, please return the following form to the Designated Copyright Agent. Please note that if you provide a counter notice, in accordance with the our Privacy Policy (located at the site) and the terms of the DMCA, the counter notice will be given to the complaining party. </p><p style="text-align: justify"><strong>COUNTER NOTICE</strong></p><ul style="text-align: justify"> <li> Identification of the material that has been removed or to which access has been disabled on the service and the location at which the material appeared before it was removed or access to it was disabled: </li><li> I hereby state under penalty of perjury that I have a good faith belief that the material was removed or disabled as a result of mistake or misidentification of the material to be removed or disabled. </li><li> Your name, address, telephone number and, if available, email address: </li><li> I hereby state that I consent to the jurisdiction of the Federal District Court for the judicial district in which my address is located or, if my address is outside of the United States, for any judicial district in which we may be found, and I will accept service of process from the complaining party who notified us of the alleged infringement or an agent of such person. </li><li> Your physical or electronic signature (full legal name):____________________________ </li></ul> <p style="text-align: justify"> The Counter Notice should be delivered to our Designated Copyright Agent: Copyright Agent this site DMCA Division </p><p style="text-align: justify"> <strong>Notification of Trademark Infringement</strong> </p><p style="text-align: justify"> If you believe that your trademark (the “Mark”) is being used by a user in a way that constitutes trademark infringement, please provide our Designated Copyright Agent (specified above) with the following information: </p><ul style="text-align: justify"> <li> Your physical or electronic signature, or a physical or electronic signature of a person authorized to act on your behalf; </li><li> Information reasonably sufficient to permit it to contact you or your authorized agent, including a name, address, telephone number and, if available, an email address; </li><li> Identification of the Mark(s) alleged to have been infringed, including <ul> <li> for registered Marks, a copy of each relevant federal trademark registration certificate or </li><li> for common law or other Marks, evidence sufficient to establish your claimed rights in the Mark, including the nature of your use of the Mark, and the time period and geographic area in which the Mark has been used by you; </li></ul> </li><li> Information reasonably sufficient to permit our Designated Copyright Agent to identify the use being challenged; </li><li> A statement that you have not authorized the challenged use, and that you have a good-faith belief that the challenged use is not authorized by law; and </li><li> A statement under penalty of perjury that all of the information in the notification is accurate and that you are the Mark owner, or are authorized to act on behalf of the Mark owner. </li></ul> <p style="text-align: justify"> Upon receipt of notice as described above, our Designated Copyright Agent will seek to confirm the existence of the Mark on the Service, notify the registered user who posted the content including the Mark, and take whatever action, in its sole discretion, it deems appropriate, including temporary or permanent removal of the Mark from the Service. </p><p style="text-align: justify"> A registered user may respond to notice of takedown by showing either (a) that the Mark has been cancelled, or has expired or lapsed or (b) that the registered user has a trademark registration, an unexpired license covering the use, or some other relevant right to the Mark, or (c) that the use is for other reasons shown by the registered user non-infringing. If the registered user makes an appropriate showing of either (a), (b) or (c) then our Designated Copyright Agent may exercise its discretion not to remove the Mark. </p><p style="text-align: justify"> If our Designated Copyright Agent decides to comply with a takedown request, it will do so within a reasonably expeditious period of time. Notwithstanding the foregoing, our Designated Copyright Agent will comply as appropriate with the terms of any court order relating to alleged trademark infringement on the Service. </p><p style="text-align: justify"> <strong >Notification of Other Intellectual Property (“IP”) Infringement</strong > </p><p style="text-align: justify"> If you believe that some other IP right of yours is being infringed by a user, please provide our Designated Copyright Agent (specified above) with the following information: </p><ul style="text-align: justify"> <li> Your physical or electronic signature, or a physical or electronic signature of a person authorized to act on your behalf; </li><li> Information reasonably sufficient to permit our Designated Copyright Agent to contact you or your authorized agent, including a name, address, telephone number and, if available, an email address; </li><li> Identification of the IP alleged to have been infringed, including (i) a complete description or explanation of the nature of the IP, (ii) evidence that you own the IP in the relevant jurisdiction, including copies of relevant patents, registrations, certifications or other documentary evidence of your ownership, and (iii) a showing sufficient for our Designated Copyright Agent to determine without unreasonable effort that the IP has been infringed; </li><li> Information reasonably sufficient to permit our Designated Copyright Agent to identify the use being challenged; </li><li> A statement that you have not authorized the challenged use, and that you have a good-faith belief that the challenged use is not authorized by law; and </li><li> A statement under penalty of perjury that all of the information in the notification is accurate and, that you are the IP owner, or are authorized to act on behalf of the IP owner. </li></ul> <p style="text-align: justify"> Upon receipt of notice as described above, our Designated Copyright Agent will seek to confirm the existence of the IP on the Service, notify the registered user who posted the content including the IP, and take whatever action, in its sole discretion, it deems appropriate, including temporary or permanent removal of the IP from the Service. </p><p style="text-align: justify"> A registered user may respond to notice of takedown by showing either (a) that the claimant does not own the IP or (b) that the IP is not infringed. If the registered user succeeds in showing either (a), (b) or (c) then our Designated Copyright Agent may exercise its discretion not to remove the IP. </p><p style="text-align: justify"> If our Designated Copyright Agent decides to comply with a takedown request, it will do so within a reasonably expeditious period of time. </p><p style="text-align: justify"> We Have No Obligation to Adjudicate IP Claims – User’s Agreement to Hold Us Harmless From Claims </p><p style="text-align: justify"> Claimants and users must understand that we are not an intellectual property tribunal. While we and our Designated Copyright Agent may in our discretion use the information provided in order to decide how to respond to infringement claims, we are not responsible for determining the merits of such claims. If a user responds to a claim of infringement by providing assurances that its content is not infringing, the user agrees that if we thereafter restore or maintain the content, the user will defend and hold us harmless from any resulting claims of infringement brought against us and our Designated Copyright Agent. </p>`;

    res.header("content-type", "text/javascript");
    res.write(
      `document.querySelector("title").remove();\nvar meta = ${JSON.stringify(
        meta
      )};document.querySelector("head").insertAdjacentHTML("beforeend", meta);\n`
    );

    res.write(
      `var title = document.querySelector("#title");var postTitle = document.querySelector("#postTitle");title.innerHTML = ${JSON.stringify(
        settings["meta-title"]
      )};postTitle.innerHTML = "DMCA";\n`
    );

    res.write(
      `var content = ${JSON.stringify(
        results
      )};document.querySelector("#isPage").insertAdjacentHTML("beforeend", content);document.querySelector(".preloader").remove();`
    );

    res.send();
  } catch (e) {}
});

app.get("/privacy.js", async (req, res) => {
  try {
    let query = req.query;
    let time = parseInt(query.t);
    let url = decodeURIComponent(query.v);
    url = new URL(url);
    let permalink = "/search/?q=";
    // console.log(url);
    let kw = url.search.split("?q=")[1];
    kw = decodeURIComponent(kw).toLowerCase();
    try {
      kw = kw.replace(/\+/g, " ").replace(/\-/g, " ");
    } catch (e) {}

    let settings = await curlContent(url.origin + "/settings.json");
    try {
      settings = JSON.parse(settings);
    } catch (e) {
      settings = [];
    }

    if (settings == "") {
      settings["meta-title"] = decodeURIComponent(query.ttl);
      settings["meta-description"] = decodeURIComponent(query.d);
      settings["meta-keyword"] =
        decodeURIComponent(query.ttl) + "," + decodeURIComponent(query.k);
      settings["author"] = decodeURIComponent(query.a);
      settings["main-keyword"] = decodeURIComponent(query.k);
      permalink = "/search?q=";
    }

    let meta = `<title>Privacy Policy - ${settings["meta-title"]}</title><meta name="description" content="Privacy Policy for ${settings["meta-title"]}" />`;

    let results = `<p style="text-align: justify;">The following is the privacy policy of google.</p><p style="text-align: justify;">Last modified: March 1, 2012 (<a href="http://www.google.com/policies/privacy/archive/" rel="nofollow">view archived versions</a>)</p><p style="text-align: justify;">There are many different ways you can use our services - to search for and share information, to communicate with other people or to create new content. When you share information with us, for example by creating a <a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-account" rel="nofollow">Google Account</a>, we can make those services even better - to show you more relevant search results and ads, to help you connect with people or to make sharing with others quicker and easier. As you use our services, we want you to be clear how we're using information and the ways in which you can protect your privacy.</p><p>Our Privacy Policy explains: <br/> <ul> <li>What information we collect and why we collect it.</li><li>How we use that information.</li><li>The choices we offer, including how to access and update information.</li></ul> </p><p style="text-align: justify;">We've tried to keep it as simple as possible, but if you're not familiar with terms like cookies, IP addresses, pixel tags and browsers, then read about these <a href="http://www.google.com/policies/privacy/key-terms/" rel="nofollow">key terms</a> first. Your privacy matters to Google so whether you are new to Google or a long-time user, please do take the time to get to know our practices - and if you have any questions <a href="http://www.google.com/support/websearch/bin/answer.py?answer=151265&amp;hl=en" rel="nofollow">contact us</a>.</p><h3 id="infocollect" style="text-align: justify;">Information we collect</h3> <p style="text-align: justify;">We collect information to provide better services to all of our users - from figuring out basic stuff like which language you speak, to more complex things like which ads you'll find most useful or the people who matter most to you online.</p><p style="text-align: justify;">We collect information in two ways:</p><ul style="text-align: justify;"> <li>Information you give us. For example, many of our services require you to sign up for a Google Account. When you do, we'll ask for <a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-personal-info" rel="nofollow">personal information</a>, like your name, email address, telephone number or credit card. If you want to take full advantage of the sharing features we offer, we might also ask you to create a publicly visible <a href="http://support.google.com/accounts/bin/answer.py?hl=en&amp;answer=112783" rel="nofollow">Google Profile</a>, which may include your name and photo.</li><li>Information we get from your use of our services. We may collect information about the services that you use and how you use them, like when you visit a website that uses our advertising services or you view and interact with our ads and content. This information includes: <ul> <li>Device informationWe may collect device-specific information (such as your hardware model, operating system version, unique device identifiers, and mobile network information including phone number). Google may associate your device identifiers or phone number with your Google Account.</li><li>Log informationWhen you use our services or view content provided by Google, we may automatically collect and store certain information in <a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-server-logs" rel="nofollow">server logs</a>. This may include: <ul> <li>details of how you used our service, such as your search queries.</li><li>telephony log information like your phone number, calling-party number, forwarding numbers, time and date of calls, duration of calls, SMS routing information and types of calls.</li><li><a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-ip" rel="nofollow">Internet protocol address</a>.</li><li>device event information such as crashes, system activity, hardware settings, browser type, browser language, the date and time of your request and referral URL.</li><li>cookies that may uniquely identify your browser or your Google Account.</li></ul> </li><li>Location informationWhen you use a location-enabled Google service, we may collect and process information about your actual location, like GPS signals sent by a mobile device. We may also use various technologies to determine location, such as sensor data from your device that may, for example, provide information on nearby Wi-Fi access points and cell towers.</li><li>Unique application numbersCertain services include a unique application number. This number and information about your installation (for example, the operating system type and application version number) may be sent to Google when you install or uninstall that service or when that service periodically contacts our servers, such as for automatic updates.</li><li>Local storageWe may collect and store information (including personal information) locally on your device using mechanisms such as browser web storage (including HTML 5) and application data caches.</li><li>Cookies and anonymous identifiersWe use various technologies to collect and store information when you visit a Google service, and this may include sending one or more <a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-cookie" rel="nofollow">cookies</a> or <a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-identifier" rel="nofollow">anonymous identifiers</a> to your device. We also use cookies and anonymous identifiers when you interact with services we offer to our partners, such as advertising services or Google features that may appear on other sites.</li></ul> </li></ul> <h3 id="infouse" style="text-align: justify;">How we use information we collect</h3> <p style="text-align: justify;">We use the information we collect from all of our services to provide, maintain, protect and improve them, to develop new ones, and to protect Google and our users. We also use this information to offer you tailored content - like giving you more relevant search results and ads.</p><p style="text-align: justify;">We may use the name you provide for your Google Profile across all of the services we offer that require a Google Account. In addition, we may replace past names associated with your Google Account so that you are represented consistently across all our services. If other users already have your email, or other information that identifies you, we may show them your publicly visible Google Profile information, such as your name and photo.</p><p style="text-align: justify;">When you contact Google, we may keep a record of your communication to help solve any issues you might be facing. We may use your email address to inform you about our services, such as letting you know about upcoming changes or improvements.</p><p style="text-align: justify;">We use information collected from cookies and other technologies, like <a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-pixel" rel="nofollow">pixel tags</a>, to improve your user experience and the overall quality of our services. For example, by saving your language preferences, we'll be able to have our services appear in the language you prefer. When showing you tailored ads, we will not associate a cookie or anonymous identifier with sensitive categories, such as those based on race, religion, sexual orientation or health.</p><p style="text-align: justify;">We may combine personal information from one service with information, including personal information, from other Google services - for example to make it easier to share things with people you know. We will not combine DoubleClick cookie information with personally identifiable information unless we have your opt-in consent.</p><p style="text-align: justify;">We will ask for your consent before using information for a purpose other than those that are set out in this Privacy Policy.</p><p style="text-align: justify;">Google processes personal information on our servers in many countries around the world. We may process your personal information on a server located outside the country where you live.</p><h3 id="infochoices" style="text-align: justify;">Transparency and choice</h3> <p style="text-align: justify;">People have different privacy concerns. Our goal is to be clear about what information we collect, so that you can make meaningful choices about how it is used. For example, you can:</p><ul style="text-align: justify;"> <li><a href="https://www.google.com/dashboard/?hl=en" rel="nofollow">Review and control</a> certain types of information tied to your Google Account by using Google Dashboard.</li><li><a href="https://www.google.com/settings/ads/preferences?hl=en" rel="nofollow">View and edit</a> your ads preferences, such as which categories might interest you, using the Ads Preferences Manager. You can also opt out of certain Google advertising services here.</li><li><a href="http://support.google.com/accounts/bin/answer.py?hl=en&amp;answer=97706" rel="nofollow">Use our editor</a> to see and adjust how your Google Profile appears to particular individuals.</li><li><a href="http://support.google.com/plus/bin/static.py?hl=en&amp;page=guide.cs&amp;guide=1257347" rel="nofollow">Control</a> who you share information with.</li><li><a href="http://www.dataliberation.org/" rel="nofollow">Take information</a> out of many of our services.</li></ul> <p style="text-align: justify;">You may also set your browser to block all cookies, including cookies associated with our services, or to indicate when a cookie is being set by us. However, it's important to remember that many of our services may not function properly if your cookies are disabled. For example, we may not remember your language preferences.</p><h3 id="infosharing" style="text-align: justify;">Information you share</h3> <p style="text-align: justify;">Many of our services let you share information with others. Remember that when you share information publicly, it may be indexable by search engines, including Google. Our services provide you with different options on sharing and removing your content.</p><h3 id="access" style="text-align: justify;">Accessing and updating your personal information</h3> <p style="text-align: justify;">Whenever you use our services, we aim to provide you with access to your personal information. If that information is wrong, we strive to give you ways to update it quickly or to delete it - unless we have to keep that information for legitimate business or legal purposes. When updating your personal information, we may ask you to verify your identity before we can act on your request.</p><p style="text-align: justify;">We may reject requests that are unreasonably repetitive, require disproportionate technical effort (for example, developing a new system or fundamentally changing an existing practice), risk the privacy of others, or would be extremely impractical (for instance, requests concerning information residing on backup tapes).</p><p style="text-align: justify;">Where we can provide information access and correction, we will do so for free, except where it would require a disproportionate effort. We aim to maintain our services in a manner that protects information from accidental or malicious destruction. Because of this, after you delete information from our services, we may not immediately delete residual copies from our active servers and may not remove information from our backup systems.</p><h3 id="nosharing" style="text-align: justify;">Information we share</h3> <p style="text-align: justify;">We do not share personal information with companies, organizations and individuals outside of Google unless one of the following circumstances apply:</p><ul style="text-align: justify;"> <li>With your consentWe will share personal information with companies, organizations or individuals outside of Google when we have your consent to do so. We require opt-in consent for the sharing of any <a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-sensitive-info" rel="nofollow">sensitive personal information</a>.</li><li>With domain administratorsIf your Google Account is managed for you by a <a href="http://support.google.com/a/bin/answer.py?hl=en&amp;answer=178897" rel="nofollow">domain administrator</a> (for example, for Google Apps users) then your domain administrator and resellers who provide user support to your organization will have access to your Google Account information (including your email and other data). Your domain administrator may be able to: <ul> <li>view statistics regarding your account, like statistics regarding applications you install.</li><li>change your account password.</li><li>suspend or terminate your account access.</li><li>access or retain information stored as part of your account.</li><li>receive your account information in order to satisfy applicable law, regulation, legal process or enforceable governmental request.</li><li>restrict your ability to delete or edit information or privacy settings.</li></ul> <p>Please refer to your domain administrator's privacy policy for more information.</p></li><li>For external processingWe provide personal information to our affiliates or other trusted businesses or persons to process it for us, based on our instructions and in compliance with our Privacy Policy and any other appropriate confidentiality and security measures.</li><li>For legal reasonsWe will share personal information with companies, organizations or individuals outside of Google if we have a good-faith belief that access, use, preservation or disclosure of the information is reasonably necessary to: <ul> <li>meet any applicable law, regulation, legal process or enforceable governmental request.</li><li>enforce applicable Terms of Service, including investigation of potential violations.</li><li>detect, prevent, or otherwise address fraud, security or technical issues.</li><li>protect against harm to the rights, property or safety of Google, our users or the public as required or permitted by law.</li></ul> </li></ul> <p style="text-align: justify;">We may share aggregated, <a href="http://www.google.com/policies/privacy/key-terms/#toc-terms-info" rel="nofollow">non-personally identifiable information</a> publicly and with our partners - like publishers, advertisers or connected sites. For example, we may share information publicly to show trends about the general use of our services.</p><p style="text-align: justify;">If Google is involved in a merger, acquisition or asset sale, we will continue to ensure the confidentiality of any personal information and give affected users notice before personal information is transferred or becomes subject to a different privacy policy.</p><h3 id="infosecurity" style="text-align: justify;">Information security</h3> <p style="text-align: justify;">We work hard to protect Google and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold. In particular:</p><ul style="text-align: justify;"> <li>We encrypt many of our services <a href="http://support.google.com/websearch/bin/answer.py?answer=173733&amp;en">using SSL</a>.</li><li>We offer you <a href="http://support.google.com/accounts/bin/static.py?hl=en&amp;page=guide.cs&amp;guide=1056283&amp;topic=1056284" rel="nofollow">two step verification</a> when you access your Google Account, and a <a href="http://www.google.com/chrome/intl/en/more/security.html" rel="nofollow">Safe Browsing feature</a> in Google Chrome.</li><li>We review our information collection, storage and processing practices, including physical security measures, to guard against unauthorized access to systems.</li><li>We restrict access to personal information to Google employees, contractors and agents who need to know that information in order to process it for us, and who are subject to strict contractual confidentiality obligations and may be disciplined or terminated if they fail to meet these obligations.</li></ul> <h3 id="application" style="text-align: justify;">Application</h3> <p style="text-align: justify;">Our Privacy Policy applies to all of the services offered by Google Inc. and its affiliates, including services offered on other sites (such as our advertising services), but excludes services that have separate privacy policies that do not incorporate this Privacy Policy.</p><p style="text-align: justify;">Our Privacy Policy does not apply to services offered by other companies or individuals, including products or sites that may be displayed to you in search results, sites that may include Google services, or other sites linked from our services. Our Privacy Policy does not cover the information practices of other companies and organizations who advertise our services, and who may use cookies, pixel tags and other technologies to serve and offer relevant ads.</p><h3 id="enforcement" style="text-align: justify;">Enforcement</h3> <p style="text-align: justify;">We regularly review our compliance with our Privacy Policy. We also adhere to several <a href="http://www.google.com/policies/privacy/frameworks/" rel="nofollow">self regulatory frameworks</a>. When we receive formal written complaints, we will contact the person who made the complaint to follow up. We work with the appropriate regulatory authorities, including local data protection authorities, to resolve any complaints regarding the transfer of personal data that we cannot resolve with our users directly.</p><h3 id="policychanges" style="text-align: justify;">Changes</h3> <p style="text-align: justify;">Our Privacy Policy may change from time to time. We will not reduce your rights under this Privacy Policy without your explicit consent. We will post any privacy policy changes on this page and, if the changes are significant, we will provide a more prominent notice (including, for certain services, email notification of privacy policy changes). We will also keep prior versions of this Privacy Policy in an archive for your review.</p><h3 id="products" style="text-align: justify;">Specific product practices</h3> <p style="text-align: justify;">The following notices explain specific privacy practices with respect to certain Google products and services that you may use:</p><ul style="text-align: justify;"> <li><a href="http://www.google.com/chrome/intl/en/privacy.html" rel="nofollow">Chrome and Chrome OS</a></li><li><a href="http://books.google.com/intl/en/googlebooks/privacy.html" rel="nofollow">Books</a></li><li><a href="http://wallet.google.com/files/privacy.html?hl=en" rel="nofollow">Wallet</a></li></ul> <p style="text-align: justify;">The contents of this statement may be altered at any time, at our discretion. If you have any questions regarding the privacy policy of this site then you may <a href="/search?q=contact_page">contact us</a>.</p>`;

    res.header("content-type", "text/javascript");
    res.write(
      `document.querySelector("title").remove();\nvar meta = ${JSON.stringify(
        meta
      )};document.querySelector("head").insertAdjacentHTML("beforeend", meta);\n`
    );

    res.write(
      `var title = document.querySelector("#title");var postTitle = document.querySelector("#postTitle");title.innerHTML = ${JSON.stringify(
        settings["meta-title"]
      )};postTitle.innerHTML = "Privacy Policy";\n`
    );

    res.write(
      `var content = ${JSON.stringify(
        results
      )};document.querySelector("#isPage").insertAdjacentHTML("beforeend", content);document.querySelector(".preloader").remove();`
    );

    res.send();
  } catch (e) {}
});

app.get("*", (req, res) => {
  res.send("<center><h1>Jangan Lupa Sholat (^_^)</h1></center>");
});

module.exports = app;
