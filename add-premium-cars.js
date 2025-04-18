const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");
const fs = require("fs");

// Firebase configuration from the environment.ts file
const firebaseConfig = {
  apiKey: "AIzaSyA5pHlvPPPsngBbXQ0QkPDu6iZu1TTsozs",
  authDomain: "drivenow-de92f.firebaseapp.com",
  projectId: "drivenow-de92f",
  storageBucket: "drivenow-de92f.appspot.com",
  messagingSenderId: "184233804904",
  appId: "1:184233804904:web:5c1a32d51ee6b0e8f00c18",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define the premium cars to add
const premiumCars = [
  // Mercedes
  {
    brand: "Mercedes",
    model: "S-Class",
    group: "Sedan",
    imageURL:
      "https://www.mercedes-benz.com/en/vehicles/passenger-cars/s-class/_jcr_content/root/slider/sliderchilditems/slideritem/image/MQ7-0-image-20201202121832/01-mercedes-benz-s-class-2020-w223-3400x1440.jpeg",
    pricePerDay: 350,
    specs: {
      seats: 5,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Mercedes",
    model: "GLE",
    group: "SUV",
    imageURL:
      "https://www.mbusa.com/content/dam/mb-nafta/us/myco/my22/gle/all-vehicles/2022-GLE-SUV-1.jpg",
    pricePerDay: 380,
    specs: {
      seats: 7,
      gearbox: "Automatic",
      fuelType: "Diesel",
    },
  },
  {
    brand: "Mercedes",
    model: "EQS",
    group: "Electric",
    imageURL:
      "https://www.mercedes-benz.com/en/vehicles/passenger-cars/eqs/_jcr_content/root/slider_copy/sliderchilditems/slideritem/image/MQ7-0-image-20210416132112/01-mercedes-benz-eqs-580-4matic-v297-2021-3400x1440.jpeg",
    pricePerDay: 400,
    specs: {
      seats: 5,
      gearbox: "Automatic",
      fuelType: "Electric",
    },
  },
  {
    brand: "Mercedes",
    model: "SL Roadster",
    group: "Convertible",
    imageURL:
      "https://www.mbusa.com/content/dam/mb-nafta/us/myco/my22/sl/all-vehicles/2022-SL-ROADSTER-1.jpg",
    pricePerDay: 420,
    specs: {
      seats: 2,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },

  // Ferrari
  {
    brand: "Ferrari",
    model: "Roma",
    group: "Sedan",
    imageURL:
      "https://cdn.ferrari.com/cms/network/media/img/resize/5e14bd682cdb32285a799dfa-ferrari-roma-intro-3?width=1920&height=1080",
    pricePerDay: 750,
    specs: {
      seats: 4,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Ferrari",
    model: "Purosangue",
    group: "SUV",
    imageURL:
      "https://cdn.ferrari.com/cms/network/media/img/resize/648af9e4aa0da5684fa2a5c9-1-hero-purosangue?width=1920&height=1080",
    pricePerDay: 1200,
    specs: {
      seats: 4,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Ferrari",
    model: "SF90 Spider",
    group: "Convertible",
    imageURL:
      "https://cdn.ferrari.com/cms/network/media/img/resize/5faa73bd636e7166a31fa11a-ferrari-sf90-spider-intro-desktop-image?width=1920&height=1080",
    pricePerDay: 1500,
    specs: {
      seats: 2,
      gearbox: "Automatic",
      fuelType: "Hybrid",
    },
  },
  {
    brand: "Ferrari",
    model: "296 GTB",
    group: "Hybrid",
    imageURL:
      "https://cdn.ferrari.com/cms/network/media/img/resize/614c6a27138c89772d7a675d-296-gtb-assetto-fiorano-intro-desk?width=1920&height=1080",
    pricePerDay: 980,
    specs: {
      seats: 2,
      gearbox: "Automatic",
      fuelType: "Hybrid",
    },
  },

  // Lamborghini
  {
    brand: "Lamborghini",
    model: "Urus",
    group: "SUV",
    imageURL:
      "https://www.lamborghini.com/sites/it-en/files/DAM/lamborghini/facelift_2019/models_gw/urus/2023/model_chooser/urus_s_m.jpg",
    pricePerDay: 900,
    specs: {
      seats: 5,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Lamborghini",
    model: "Huracán Spyder",
    group: "Convertible",
    imageURL:
      "https://www.lamborghini.com/sites/it-en/files/DAM/lamborghini/facelift_2019/models_gw/huracan-evo-rwd-spyder/model_chooser/Huracan_Evo_RWD_Spyder_cc.jpg",
    pricePerDay: 1250,
    specs: {
      seats: 2,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Lamborghini",
    model: "Countach LPI 800-4",
    group: "Hybrid",
    imageURL:
      "https://www.lamborghini.com/sites/it-en/files/DAM/lamborghini/facelift_2019/models_gw/few_off/countach/model_chooser/countach_lpi_00_m.jpg",
    pricePerDay: 2000,
    specs: {
      seats: 2,
      gearbox: "Automatic",
      fuelType: "Hybrid",
    },
  },

  // Porsche
  {
    brand: "Porsche",
    model: "911",
    group: "Sedan",
    imageURL:
      "https://files.porsche.com/filestore/image/multimedia/none/992-carrange-jdp-2023/normal/cfc21683-1a9c-11ee-810c-005056bbdc38;sL;twebp/porsche-normal.webp",
    pricePerDay: 650,
    specs: {
      seats: 4,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Porsche",
    model: "Cayenne",
    group: "SUV",
    imageURL:
      "https://files.porsche.com/filestore/image/multimedia/none/9ya-e3-i-modelimage-sideshot/normal/6ffcc764-be74-11ed-80f5-005056bbdc38;sL;twebp/porsche-normal.webp",
    pricePerDay: 480,
    specs: {
      seats: 5,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Porsche",
    model: "Taycan",
    group: "Electric",
    imageURL:
      "https://files.porsche.com/filestore/image/multimedia/none/j1-taycan-modelimage-sideshot/normal/3cf76e8c-152a-11ea-80c6-005056bbdc38;sL;twebp/porsche-normal.webp",
    pricePerDay: 550,
    specs: {
      seats: 4,
      gearbox: "Automatic",
      fuelType: "Electric",
    },
  },
  {
    brand: "Porsche",
    model: "718 Boxster",
    group: "Convertible",
    imageURL:
      "https://files.porsche.com/filestore/image/multimedia/none/982-718boxster-modelimage-sideshot/normal/aeb16bc6-591f-11e9-80c4-005056bbdc38;sL;twebp/porsche-normal.webp",
    pricePerDay: 520,
    specs: {
      seats: 2,
      gearbox: "Manual",
      fuelType: "Gasoline",
    },
  },

  // Rolls Royce
  {
    brand: "Rolls Royce",
    model: "Ghost",
    group: "Sedan",
    imageURL:
      "https://www.rolls-roycemotorcars.com/content/dam/rrmc/marketUK/rollsroycemotorcars_com/ghost-ewo/page-properties/rolls-royce-ghost-ewb-page-properties-image.jpg",
    pricePerDay: 1800,
    specs: {
      seats: 5,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Rolls Royce",
    model: "Cullinan",
    group: "SUV",
    imageURL:
      "https://www.rolls-roycemotorcars.com/content/dam/rrmc/marketUK/rollsroycemotorcars_com/cullinan-bespoke/page-properties/rolls-royce-cullinan-bespoke-share-image.jpg",
    pricePerDay: 2200,
    specs: {
      seats: 5,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Rolls Royce",
    model: "Spectre",
    group: "Electric",
    imageURL:
      "https://www.rolls-roycemotorcars.com/content/dam/rrmc/marketUK/rollsroycemotorcars_com/2-9-1-spectre/page-properties/RR_Spectre_Sharing.jpg",
    pricePerDay: 2500,
    specs: {
      seats: 4,
      gearbox: "Automatic",
      fuelType: "Electric",
    },
  },
  {
    brand: "Rolls Royce",
    model: "Dawn",
    group: "Convertible",
    imageURL:
      "https://www.topgear.com/sites/default/files/news-listicle/image/rolls-royce_dawn_7.jpg",
    pricePerDay: 2300,
    specs: {
      seats: 4,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },

  // Bentley
  {
    brand: "Bentley",
    model: "Flying Spur",
    group: "Sedan",
    imageURL:
      "https://www.bentleymotors.com/content/dam/bentley/Master/Models/Gallery/flying-spur/FS_Azure_1920x1080%201.jpg/_jcr_content/renditions/original.image_file.1920.1080.file/FS_Azure_1920x1080%201.jpg",
    pricePerDay: 1100,
    specs: {
      seats: 5,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Bentley",
    model: "Bentayga",
    group: "SUV",
    imageURL:
      "https://www.bentleymotors.com/content/dam/bentley/Master/Models/derivative-strategy-/bentayga-ewb/Bentley_Bentayga-EWB_on-ice.jpg/_jcr_content/renditions/original.image_file.1920.1080.file/Bentley_Bentayga-EWB_on-ice.jpg",
    pricePerDay: 1300,
    specs: {
      seats: 5,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Bentley",
    model: "Continental GT",
    group: "Sedan",
    imageURL:
      "https://www.bentleymotors.com/content/dam/bentley/Master/World%20of%20Bentley/Mulliner/redesign/coachbuilt/Bentley_Mulliner_Batur_side%20profile_16-9.jpg/_jcr_content/renditions/original.image_file.1920.1080.file/Bentley_Mulliner_Batur_side%20profile_16-9.jpg",
    pricePerDay: 950,
    specs: {
      seats: 4,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Bentley",
    model: "Continental GTC",
    group: "Convertible",
    imageURL:
      "https://www.bentleymotors.com/content/dam/bentley/Master/Models/Gallery/Continental%20GT%20Convertible/azure/bentley-continental-gc-azure-24my-styling-specification-1920x1080.jpg/_jcr_content/renditions/original.image_file.1920.1080.file/bentley-continental-gc-azure-24my-styling-specification-1920x1080.jpg",
    pricePerDay: 1050,
    specs: {
      seats: 4,
      gearbox: "Automatic",
      fuelType: "Gasoline",
    },
  },
  {
    brand: "Bentley",
    model: "Flying Spur Hybrid",
    group: "Hybrid",
    imageURL:
      "https://www.bentleymotors.com/content/dam/bentley/Master/Models/Gallery/flying-spur-hybrid/flying-spur-hybrid-profile-wheel.jpg/_jcr_content/renditions/original.image_file.1920.1080.file/flying-spur-hybrid-profile-wheel.jpg",
    pricePerDay: 1250,
    specs: {
      seats: 5,
      gearbox: "Automatic",
      fuelType: "Hybrid",
    },
  },
];

// Function to add cars to the database
async function addCarsToDatabase() {
  let successCount = 0;
  let errorCount = 0;

  console.log(`Connecting to Firebase project: ${firebaseConfig.projectId}`);
  console.log(`Adding ${premiumCars.length} premium cars to the database...`);

  for (const car of premiumCars) {
    try {
      // Ensure all cars have the required specs
      if (!car.specs) {
        car.specs = {
          seats: 2,
          gearbox: "Automatic",
          fuelType: "Gasoline",
        };
      }

      const docRef = await addDoc(collection(db, "cars"), car);
      console.log(
        `✅ Added ${car.brand} ${car.model} (${car.group}) with ID: ${docRef.id}`
      );
      successCount++;
    } catch (error) {
      console.error(`❌ Error adding ${car.brand} ${car.model}:`, error);
      errorCount++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total cars processed: ${premiumCars.length}`);
  console.log(`Successfully added: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  console.log("=================");
}

// Execute the function
addCarsToDatabase();
