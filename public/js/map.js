let dist = document.getElementById("district").value;
let brgy = document.getElementById("barangay").value;
let sect = "";

const loader = document.getElementById("loader");
const submitbtn = document.getElementById("submit");
const closePopupBtn = document.getElementById("closePopupBtn");
const pdfFrameContainer = document.getElementById("pdfFrameContainer");
const createPDF = document.getElementById("createPDF");
const pdfFrame = document.getElementById("pdfFrame");
const map_container = document.getElementById("map_container");
const scale = document.getElementById("scale");
const scalebarcolor = document.getElementById("scalebarcolor");
const menu = document.getElementById("menu");
const perimeter_container = document.getElementById("perimeter_container");
const save_button = document.getElementById("save_button");
const logo_image = document.getElementById("logo_image");
const perimeter_logo = document.getElementById("perimeter_logo");
const logo = document.getElementById("logo");
const variables_container = document.getElementById("variables_container");
const report = document.getElementById("report");
const template_title = document.getElementById("template_title");

const district_container = document.getElementById("district_container");
const barangay_container = document.getElementById("barangay_container");
const section_container = document.getElementById("section_container");

const district = document.getElementById("district");
const barangay = document.getElementById("barangay");
const section = document.getElementById("section");

const td_provcity = document.getElementById("td_provcity");
const td_mundist = document.getElementById("td_mundist");
const td_barangay = document.getElementById("td_barangay");
const td_section = document.getElementById("td_section");

const perimeter_preparer_signature = document.getElementById("perimeter_preparer_signature");
const perimeter_verifier_signature = document.getElementById("perimeter_verifier_signature");
const perimeter_approver_signature = document.getElementById("perimeter_approver_signature");
const preparer_signature = document.getElementById("preparer_signature");
const verifier_signature = document.getElementById("verifier_signature");
const approver_signature = document.getElementById("approver_signature");
const prep_sig = document.getElementById("prep_sig");
const ver_sig = document.getElementById("ver_sig");
const app_sig = document.getElementById("app_sig");

const prepared = document.getElementById("prepared");
const prep_pos = document.getElementById("prep_pos");
const verified = document.getElementById("verified");
const ver_pos = document.getElementById("ver_pos");
const approved = document.getElementById("approved");
const app_pos = document.getElementById("app_pos");

const delete_prep = document.getElementById("delete_prep");
const delete_ver = document.getElementById("delete_ver");
const delete_app = document.getElementById("delete_app");

const perimeter_id = document.getElementById("perimeter_id");
const perimeter_prepared = document.getElementById("perimeter_prepared");
const perimeter_prepared_position = document.getElementById("perimeter_prepared_position");
const perimeter_verified = document.getElementById("perimeter_verified");
const perimeter_verified_position = document.getElementById("perimeter_verified_position");
const perimeter_approved = document.getElementById("perimeter_approved");
const perimeter_approved_position = document.getElementById("perimeter_approved_position");

const table_prov_city = document.getElementById("table_prov_city");
const table_mun_dist = document.getElementById("table_mun_dist");
const table_section = document.getElementById("table_section");
const table_barangay = document.getElementById("table_barangay");

var wfsURL = "http://map.davaocity.gov.ph:8080/geoserver/wfs";
var typeName = "Davao:rptas_parcelblack";
var wfsRequestUrl = wfsURL + '?service=WFS&version=2.0.0&request=GetFeature&typeName=' + typeName + '&outputFormat=application/json&SrsName=EPSG:4326';

var map = L.map("map", {
  zoomSnap: 0.1,
  zoomDelta: 0.1,
  attributionControl: false,
}).setView([7.1907, 125.4553], 1);

L.control.scale().addTo(map);

var parcel = L.tileLayer.wms(
  "http://map.davaocity.gov.ph:8080/geoserver/wms?",
  {
    layers: "Davao:rptas_parcelblack",
    transparent: "true",
    tiled: true,
    format: "image/png",
    opacity: 1,
    maxZoom: 20,
    maxNativeZoom: 20,
    Identify: false,
    preserveDrawingBuffer: true,
  }
).addTo(map);

window.onload = async () => {
  loader_on();
  await fetch("http://localhost:5000/getDistrict")
  .then((response) => response.json())
  .then((data) => {
    var option = document.createElement("option");
    district.appendChild(option);
    for(var x = 0;x < data.length;x++){
      option = document.createElement("option");
      option.value = data[x].districtcode;
      option.innerHTML = data[x].admindistrict;
      district.appendChild(option);
    }
    
  });
  await setBarangayList();

  parcel.addTo(map);

  fetch(wfsRequestUrl)
  .then(response => response.json())
  .then(data => {
      var boundingBox = calculateBoundingBox(data);
      map.fitBounds(boundingBox);
      loader_off();
  })
  .catch(error => console.error('Error:', error));

  setTemplateTitle();
  await getPerims(() => {
    loader_off();
  });
}

async function setBarangayList() {
  while(barangay.options.length > 0) {
    barangay.remove(0);
  }

  if(district.value == ""){
    console.log("Choose a District");
  } else {
    fetch("http://localhost:5000/getBarangay/" + district.value)
    .then((response) => response.json())
    .then((data) => {
      for(var y = 0;y < data.length;y++){
        var option = document.createElement("option");
        var brgycode = data[y].brgycode.slice(2);
        option.value = brgycode;
        option.innerHTML = data[y].brgy;
        barangay.appendChild(option);
      }
    });
  }
}

async function setWFS(dist, brgy, sect) {
  if(report.value == "PROPERTY IDENTIFICATION MAP"){
    var cqlFilter = `dist = '${dist}' and brgy = '${brgy}' and sect = '${sect}'`;
  } else if(report.value == "SECTION INDEX MAP"){
    var cqlFilter = `dist = '${dist}' and brgy = '${brgy}'`;
  } else if(report.value == "BARANGAY INDEX MAP"){
    var cqlFilter = `dist = '${dist}'`;
  }
  map.removeLayer(parcel);

  if(dist == "" && brgy == "" && sect == ""){
    parcel = L.tileLayer.wms(
      "http://map.davaocity.gov.ph:8080/geoserver/wms?",
      {
        layers: "Davao:rptas_parcelblack",
        transparent: "true",
        tiled: true,
        format: "image/png",
        opacity: 1,
        maxZoom: 20,
        maxNativeZoom: 20,
        Identify: false,
        preserveDrawingBuffer: true,
      }
    ).addTo(map);

    wfsRequestUrl = wfsURL + '?service=WFS&version=2.0.0&request=GetFeature&typeName=' + typeName + '&outputFormat=application/json&SrsName=EPSG:4326';
  } else {
    parcel = L.tileLayer.wms(
      "http://map.davaocity.gov.ph:8080/geoserver/wms?",
      {
        layers: "Davao:rptas_parcelblack",
        transparent: "true",
        tiled: true,
        format: "image/png",
        opacity: 1,
        maxZoom: 20,
        maxNativeZoom: 20,
        Identify: false,
        CQL_FILTER: cqlFilter,
        preserveDrawingBuffer: true,
      }
    ).addTo(map);

    wfsRequestUrl = wfsURL + '?service=WFS&version=2.0.0&request=GetFeature&typeName=' + typeName + '&outputFormat=application/json&CQL_FILTER=' + encodeURIComponent(cqlFilter) + '&SrsName=EPSG:4326';
  }

  fetch(wfsRequestUrl)
    .then(response => response.json())
    .then(data => {
        var boundingBox = calculateBoundingBox(data);
        map.fitBounds(boundingBox);
        loader_off();
    })
    .catch(error => {
      alert("Location not yet updated");
      loader_off();
    });
}

function calculateBoundingBox(data) {
  var features = data.features;
  var boundingBox = L.latLngBounds();

  features.forEach(feature => {
    var geometry = feature.geometry;

    if (geometry.type === 'Polygon') {
        geometry.coordinates.forEach(ring => {
            ring.forEach(coord => {
                boundingBox.extend(L.latLng(coord[1], coord[0]));
            });
        });
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => {
                ring.forEach(coord => {
                    boundingBox.extend(L.latLng(coord[1], coord[0]));
                });
            });
        });
    }
});

  return boundingBox;
}

async function captureLeaflet() {
  dist = document.getElementById("district").value;
  brgy = document.getElementById("barangay").value;
  sect = document.getElementById("section").value;
  map.whenReady(function () {
    html2canvas(document.getElementById('map_container'), {allowTaint: true, useCORS: true, scale: 2}).then(function(canvas) {
        pdfFrameContainer.style.display = "block";
        const pdfOptions = {
          margin: 5,
          title: dist + "-" + brgy + "-" + sect + ".pdf",
          image: { type: "png", quality: 2 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a3", orientation: "landscape" },
        };

        html2pdf()
        .from(canvas)
        .set(pdfOptions)
        .outputPdf("blob")
        .then((pdf) => {
          if (pdf instanceof Blob) {
            const pdfUrl = URL.createObjectURL(pdf);
            pdfFrame.src = pdfUrl;
          } else {
            console.error("FAILED!");
          }
        })
        .catch((error) => {
          console.error("Error generating PDF:", error);
        });
        
        loader_off();
    });
  });
}

async function getPerims(callback) {
  await fetch("http://localhost:5000/getPerimeters")
  .then((response) => response.json())
  .then((data) => {
    perimeter_id.value = data[0].id;
    perimeter_prepared.value = data[0].prepared_name;
    perimeter_prepared_position.value = data[0].prepared_position;
    perimeter_verified.value = data[0].verified_name;
    perimeter_verified_position.value = data[0].verified_position;
    perimeter_approved.value = data[0].approved_name;
    perimeter_approved_position.value = data[0].approved_position;

    prepared.innerHTML = data[0].prepared_name;
    prep_pos.innerHTML = data[0].prepared_position;
    verified.innerHTML = data[0].verified_name;
    ver_pos.innerHTML = data[0].verified_position;
    approved.innerHTML = data[0].approved_name;
    app_pos.innerHTML = data[0].approved_position;
  });

  await setPerimeterImage(logo_image, perimeter_logo.id);
  await setPerimeterImage(preparer_signature, perimeter_preparer_signature.id);
  await setPerimeterImage(verifier_signature, perimeter_verifier_signature.id);
  await setPerimeterImage(approver_signature, perimeter_approver_signature.id);
  await setImage(logo, perimeter_logo.id);
  await setImage(prep_sig, perimeter_preparer_signature.id);
  await setImage(ver_sig, perimeter_verifier_signature.id);
  await setImage(app_sig, perimeter_approver_signature.id);

  setTimeout(() => {
    callback();
  }, 1000);
}

async function setPerimeterImage(image, image_type) {
  await fetch("http://localhost:5000/checkImage?image_type=" + image_type)
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
      image.src = "./image/default.jpg";
    } else {
      fetch("http://localhost:5000/getImage?image_type=" + image_type);
      image.src = "http://localhost:5000/getImage?image_type=" + image_type;
    }
  })
  .catch((error) => console.error("Error fetching data", error));
}

async function setImage(image, image_type){
  await fetch("http://localhost:5000/checkImage?image_type=" + image_type)
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
      image.style.visibility = "hidden";
      image.style.height = "0px"
    } else {
      fetch("http://localhost:5000/getImage?image_type=" + image_type);
      image.style.visibility = "visible";
      image.src = "http://localhost:5000/getImage?image_type=" + image_type;
    }
  })
  .catch((error) => console.error("Error fetching data", error));
}

async function changeImage(event, image) {
  const selectedFile = event.target.files[0];
  const selectorId = event.target.id;
  const imageSelector = document.getElementById(selectorId);

  if (selectedFile) {
    const fileType = selectedFile.type;

    if (!fileType.startsWith("image/")) {
      alert("File not image");
      imageSelector.value = "";
    } else {
      const imageURL = URL.createObjectURL(selectedFile);
      image.src = imageURL;
    }
  }
}

async function uploadImage(image, image_type) {
  if (image.files[0]) {
    await fetch("http://localhost:5000/checkImage?image_type=" + image_type)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        insertImage(image, image_type);
      } else {
        deleteImage(data);
        updateImage(image, image_type);
      }
    })
    .catch((error) => console.error("Error fetching data", error));
  } else {
    console.log("NO FILE HAS BEEN CHOSEN");
  }
}

async function deleteImage(data) {
  await fetch("http://localhost:5000/delete?path_find=" + data.path_find)
    .then((response) => {
      if (response.ok) {
        console.log("Image updated successfully!");
      } else {
        console.log(
          "Error deleting the exiting file:",
          response.status,
          response.statusText
        );
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

async function insertImage(image, image_type) {
  const fileInput = image;
  const file = fileInput.files[0];

  if (file) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("image_type", image_type);

    fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error(error);
    });
  }
}

async function updateImage(image, image_type) {
  const fileInput = image;
  const file = fileInput.files[0];

  if (file) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("image_type", image_type);

    fetch("http://localhost:5000/update", {
      method: "PUT",
      body: formData,
    })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error(error);
    });
  }
}

async function deleteSignature(image_type) {
  await fetch("http://localhost:5000/deleteImage?image_type=" + image_type)
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
      console.log("Error in deleting the data image");
    } else {
      console.log("Successfully deleted!");
    }
  })
}

async function setTemplateTitle() {
  template_title.innerHTML = report.value;
}

async function clearFields() {
  district.selectedIndex = 0;
  section.value = "";
  setBarangayList();
}

async function loader_on() {
  loader.style.visibility = "visible";
  createPDF.disabled = true;
  submitbtn.disabled = true;
}

async function loader_off() {
  loader.style.visibility = "hidden";
  createPDF.disabled = false;
  submitbtn.disabled = false;
}

perimeter_logo.addEventListener("change", async (event) => {
  changeImage(event, logo_image);
});

perimeter_preparer_signature.addEventListener("change", async (event) => {
  changeImage(event, preparer_signature);
});

perimeter_verifier_signature.addEventListener("change", async (event) => {
  changeImage(event, verifier_signature);
});

perimeter_approver_signature.addEventListener("change", async (event) => {
  changeImage(event, approver_signature);
});

save_button.addEventListener("click", async () => {
  loader_on();
  
  if(perimeter_logo.files[0]){
    await uploadImage(perimeter_logo, perimeter_logo.id);
  }
  if(perimeter_preparer_signature.files[0]){
    await uploadImage(perimeter_preparer_signature, perimeter_preparer_signature.id);
  }
  if(perimeter_verifier_signature.files[0]){
    await uploadImage(perimeter_verifier_signature, perimeter_verifier_signature.id);
  }
  if(perimeter_approver_signature.files[0]){
    await uploadImage(perimeter_approver_signature, perimeter_approver_signature.id);
  }
  
  const prepared_name = perimeter_prepared.value;
  const prepared_position = perimeter_prepared_position.value;
  const verified_name = perimeter_verified.value;
  const verified_position = perimeter_verified_position.value;
  const approved_name = perimeter_approved.value;
  const approved_position = perimeter_approved_position.value;
  const id = perimeter_id.value;

  await fetch("http://localhost:5000/updatePerimeters", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prepared_name,
      prepared_position,
      verified_name,
      verified_position,
      approved_name,
      approved_position,
      id,
    }),
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
      console.log(data.error);
    } else {
      console.log(data);
    }
  });

  await getPerims(() => {
    loader_off();
  });
});

district.addEventListener("change", async () => {
  setBarangayList();
});

submitbtn.addEventListener("click", async () => {
  loader_on();
  dist = document.getElementById("district").value;
  brgy = document.getElementById("barangay").value;
  sect = document.getElementById("section").value;

  table_prov_city.innerHTML = "172";
  table_mun_dist.innerHTML = dist;
  table_barangay.innerHTML = brgy;
  table_section.innerHTML = sect;

  if(report.value == "PROPERTY IDENTIFICATION MAP"){
    if(dist == "" || brgy == "" || sect == "") {
      alert("Please populate all fields!");
      loader_off();
    } else {
      setWFS(dist, brgy, sect);
    }
  } else if(report.value == "SECTION INDEX MAP"){
    if(dist == "" || brgy == "") {
      alert("Please populate all fields!");
      loader_off();
    } else {
      setWFS(dist, brgy, sect);
    }
  } else if(report.value == "BARANGAY INDEX MAP"){
    if(dist == "") {
      alert("Please populate all fields!");
      loader_off();
    } else {
      setWFS(dist, brgy, sect);
    }
  } else if(report.value == "DISTRICT INDEX MAP"){
    setWFS(dist, brgy, sect);
  }
});

createPDF.addEventListener("click", async () => {
  createPDF.disabled = true;
  perimeter_container.style.visibility = "hidden";
  loader_on();
  await captureLeaflet();
});

closePopupBtn.addEventListener("click", () => {
  pdfFrameContainer.style.display = "none";
  createPDF.disabled = false;
});

menu.addEventListener("click", async () => {
  if(perimeter_container.style.visibility == "visible") {
    perimeter_container.style.visibility = "hidden";
  } else {
    perimeter_container.style.visibility = "visible";
  }
});

delete_prep.addEventListener("click", async () => {
  await fetch("http://localhost:5000/checkImage?image_type=" + perimeter_preparer_signature.id)
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
      console.log("There are no existing image for this field");
    } else {
      deleteImage(data);
      deleteSignature(perimeter_preparer_signature.id);
    }
  })
  .catch((error) => console.error("Error fetching data", error));

  await getPerims(() => {
    loader_off();
  });
});

delete_ver.addEventListener("click", async () => {
  await fetch("http://localhost:5000/checkImage?image_type=" + perimeter_verifier_signature.id)
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
      console.log("There are no existing image for this field");
    } else {
      deleteImage(data);
      deleteSignature(perimeter_verifier_signature.id);
    }
  })
  .catch((error) => console.error("Error fetching data", error));

  await getPerims(() => {
    loader_off();
  });
});

delete_app.addEventListener("click", async () => {
  await fetch("http://localhost:5000/checkImage?image_type=" + perimeter_approver_signature.id)
  .then((response) => response.json())
  .then((data) => {
    if (data.error) {
      console.log("There are no existing image for this field");
    } else {
      deleteImage(data);
      deleteSignature(perimeter_approver_signature.id);
    }
  })
  .catch((error) => console.error("Error fetching data", error));

  await getPerims(() => {
    loader_off();
  });
});

report.addEventListener("change", async () => {
  setTemplateTitle();
  clearFields();
  if(report.value == "PROPERTY IDENTIFICATION MAP"){
    td_section.style.display = "block";
    td_barangay.style.display = "block";
    td_mundist.style.display = "block";
    td_provcity.style.display = "block";

    district_container.style.flex = "0 0 calc(33.33% - 20px)";
    barangay_container.style.flex = "0 0 calc(33.33% - 20px)";
    section_container.style.flex = "0 0 calc(33.33% - 20px)";

    district_container.style.display = "block";
    barangay_container.style.display = "block";
    section_container.style.display = "block";
  }
  if(report.value == "SECTION INDEX MAP"){
    td_section.style.display = "none";
    td_barangay.style.display = "block";
    td_mundist.style.display = "block";
    td_provcity.style.display = "block";

    district_container.style.flex = "0 0 calc(50% - 20px)";
    barangay_container.style.flex = "0 0 calc(50% - 20px)";

    district_container.style.display = "block";
    barangay_container.style.display = "block";
    section_container.style.display = "none";
  }
  if(report.value == "BARANGAY INDEX MAP"){
    td_section.style.display = "none";
    td_barangay.style.display = "none";
    td_mundist.style.display = "block";
    td_provcity.style.display = "block";

    district_container.style.flex = "0 0 calc(100% - 20px)";

    district_container.style.display = "block";
    barangay_container.style.display = "none";
    section_container.style.display = "none";
  }
  if(report.value == "DISTRICT INDEX MAP"){
    td_section.style.display = "none";
    td_barangay.style.display = "none";
    td_mundist.style.display = "none";
    td_provcity.style.display = "block";

    district_container.style.display = "none";
    barangay_container.style.display = "none";
    section_container.style.display = "none";
  }
});