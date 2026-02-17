#!/usr/bin/env node

/**
 * Seed script for shared MongoDB database
 * Populates animals, inventory items, services, locations, and users
 * Run: node seed-shared-db.mjs
 */

import mongoose from "mongoose";
import AnimalModel from "./models/Animal.js";
import InventoryModel from "./models/Inventory.js";
import ServiceModel from "./models/Service.js";
import LocationModel from "./models/Location.js";
import UserModel from "./models/User.js";
import InventoryCategoryModel from "./models/InventoryCategory.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://helloayoola_db_user:hgZYQPICwVlQkrbi@basefile.1enuwue.mongodb.net/?appName=BaseFile";

const Animal = AnimalModel;
const Inventory = InventoryModel;
const Service = ServiceModel;
const Location = LocationModel;
const User = UserModel;
const InventoryCategory = InventoryCategoryModel;

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB\n");

    // Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      Animal.deleteMany({}),
      Inventory.deleteMany({}),
      Service.deleteMany({}),
      Location.deleteMany({}),
      User.deleteMany({}),
      InventoryCategory.deleteMany({}),
    ]);
    console.log("✓ Cleared existing data\n");

    // Seed Locations
    console.log("Seeding locations...");
    const locations = await Location.create([
      {
        name: "Main Farm",
        description: "Primary farming location",
        address: "123 Farm Road",
        city: "Lagos",
        state: "Lagos",
        coordinates: { lat: 6.5244, lng: 3.3792 },
        isActive: true,
      },
      {
        name: "Outskirts Farm",
        description: "Secondary farming location",
        address: "456 Rural Lane",
        city: "Ibadan",
        state: "Oyo",
        coordinates: { lat: 7.3775, lng: 3.9470 },
        isActive: true,
      },
    ]);
    console.log(`✓ Created ${locations.length} locations\n`);

    // Seed Users
    console.log("Seeding users...");
    const users = await User.create([
      {
        name: "Admin User",
        email: "admin@farm.com",
        pin: "1234",
        role: "SuperAdmin",
        isActive: true,
        phone: "+2348012345678",
      },
      {
        name: "Chioma Okafor",
        email: "chioma@farm.com",
        pin: "5678",
        role: "Manager",
        isActive: true,
        phone: "+2348087654321",
      },
      {
        name: "Tunde Adeyemi",
        email: "tunde@farm.com",
        pin: "9012",
        role: "Attendant",
        isActive: true,
        phone: "+2348076543210",
      },
    ]);
    console.log(`✓ Created ${users.length} users\n`);

    // Seed Animals
    console.log("Seeding animals...");
    const animals = await Animal.create([
      {
        tagId: "GOAT-001",
        name: "Ayo",
        species: "Goat",
        breed: "Boer",
        class: "Grade",
        gender: "Male",
        dob: new Date("2022-05-15"),
        color: "White & Brown",
        origin: "Purchased",
        acquisitionDate: new Date("2023-01-10"),
        status: "Alive",
        location: locations[0]._id,
        paddock: "Pen A",
        currentWeight: 45,
        projectedMaxWeight: 70,
        marginPercent: 30,
        projectedSalesPrice: 85000,
        images: [
          { full: "https://via.placeholder.com/600x400?text=Goat+Ayo", thumb: "https://via.placeholder.com/150x150?text=Ayo" },
        ],
        notes: "Healthy buck, excellent bloodline for breeding",
      },
      {
        tagId: "GOAT-002",
        name: "Zainab",
        species: "Goat",
        breed: "Saanen",
        class: "Grade",
        gender: "Female",
        dob: new Date("2023-03-20"),
        color: "White",
        origin: "Bred on farm",
        status: "Alive",
        location: locations[0]._id,
        paddock: "Pen B",
        currentWeight: 35,
        projectedMaxWeight: 65,
        marginPercent: 25,
        projectedSalesPrice: 72000,
        images: [
          { full: "https://via.placeholder.com/600x400?text=Goat+Zainab", thumb: "https://via.placeholder.com/150x150?text=Zainab" },
        ],
        notes: "High milk production potential",
      },
      {
        tagId: "CHICK-001",
        name: "Golden Layer Batch",
        species: "Chicken",
        breed: "Isa Brown",
        class: "Commercial",
        gender: "Female",
        dob: new Date("2024-01-12"),
        color: "Brown",
        origin: "Purchased",
        acquisitionDate: new Date("2024-02-01"),
        status: "Alive",
        location: locations[0]._id,
        paddock: "Coop A",
        currentWeight: 1.8,
        projectedMaxWeight: 2.5,
        marginPercent: 35,
        projectedSalesPrice: 8500,
        images: [
          { full: "https://via.placeholder.com/600x400?text=Chicken", thumb: "https://via.placeholder.com/150x150?text=Chicken" },
        ],
        notes: "Layer hens, 500 birds available",
      },
      {
        tagId: "COW-001",
        name: "Beauty",
        species: "Cattle",
        breed: "Holstein-Friesian",
        class: "Dairy",
        gender: "Female",
        dob: new Date("2020-06-10"),
        color: "Black & White",
        origin: "Purchased",
        acquisitionDate: new Date("2021-09-15"),
        status: "Alive",
        location: locations[1]._id,
        paddock: "Field A",
        currentWeight: 520,
        projectedMaxWeight: 600,
        marginPercent: 20,
        projectedSalesPrice: 650000,
        images: [
          { full: "https://via.placeholder.com/600x400?text=Dairy+Cow", thumb: "https://via.placeholder.com/150x150?text=Cow" },
        ],
        notes: "High milk yield, excellent temperament",
      },
      {
        tagId: "SHEEP-001",
        name: "Blessing",
        species: "Sheep",
        breed: "Dorper",
        class: "Grade",
        gender: "Male",
        dob: new Date("2023-08-05"),
        color: "White with black face",
        origin: "Bred on farm",
        status: "Alive",
        location: locations[1]._id,
        paddock: "Pasture B",
        currentWeight: 52,
        projectedMaxWeight: 95,
        marginPercent: 28,
        projectedSalesPrice: 95000,
        images: [
          { full: "https://via.placeholder.com/600x400?text=Sheep", thumb: "https://via.placeholder.com/150x150?text=Sheep" },
        ],
        notes: "Excellent meat quality, ready for breeding",
      },
      {
        tagId: "PIG-001",
        name: "Obi",
        species: "Pig",
        breed: "Landrace",
        class: "Meat",
        gender: "Male",
        dob: new Date("2023-11-20"),
        color: "Black",
        origin: "Purchased",
        acquisitionDate: new Date("2024-01-05"),
        status: "Alive",
        location: locations[0]._id,
        paddock: "Sty A",
        currentWeight: 85,
        projectedMaxWeight: 150,
        marginPercent: 32,
        projectedSalesPrice: 125000,
        images: [
          { full: "https://via.placeholder.com/600x400?text=Pig", thumb: "https://via.placeholder.com/150x150?text=Pig" },
        ],
        notes: "Fast-growing, excellent feed conversion",
      },
    ]);
    console.log(`✓ Created ${animals.length} animals\n`);

    // Seed Inventory Categories
    console.log("Seeding inventory categories...");
    const categories = await InventoryCategory.create([
      { name: "Feed & Fodder", description: "Animal feed and forage" },
      { name: "Medications", description: "Veterinary medications and vaccines" },
      { name: "Equipment", description: "Farm tools and equipment" },
      { name: "Supplements", description: "Nutritional supplements" },
      { name: "Hygiene & Cleaning", description: "Disinfectants and cleaning supplies" },
    ]);
    console.log(`✓ Created ${categories.length} inventory categories\n`);

    // Seed Inventory
    console.log("Seeding inventory items...");
    const inventory = await Inventory.create([
      {
        item: "Poultry Starter Feed (25kg)",
        quantity: 120,
        unit: "bag",
        categoryId: categories[0]._id,
        categoryName: "Feed & Fodder",
        price: 8500,
        costPrice: 7000,
        marginPercent: 21.4,
        salesPrice: 8500,
        showOnSite: true,
        supplier: "Premier Feeds Ltd",
      },
      {
        item: "Tropical Grass Hay (50kg bale)",
        quantity: 200,
        unit: "bale",
        categoryId: categories[0]._id,
        categoryName: "Feed & Fodder",
        price: 4500,
        costPrice: 3500,
        marginPercent: 28.6,
        salesPrice: 4500,
        showOnSite: true,
        supplier: "Local Hay Supply",
      },
      {
        item: "Newcastle Vaccine (10 doses)",
        quantity: 50,
        unit: "vial",
        categoryId: categories[1]._id,
        categoryName: "Medications",
        price: 15000,
        costPrice: 12000,
        marginPercent: 25,
        salesPrice: 15000,
        showOnSite: true,
        supplier: "Animal Health Pharmacy",
        expiration: new Date("2026-12-31"),
      },
      {
        item: "Multi-Vitamin Supplement",
        quantity: 80,
        unit: "bottle",
        categoryId: categories[3]._id,
        categoryName: "Supplements",
        price: 6500,
        costPrice: 4500,
        marginPercent: 44.4,
        salesPrice: 6500,
        showOnSite: true,
        supplier: "Vitagen Ltd",
      },
      {
        item: "Chlorine-based Disinfectant (5L)",
        quantity: 40,
        unit: "container",
        categoryId: categories[4]._id,
        categoryName: "Hygiene & Cleaning",
        price: 5000,
        costPrice: 3200,
        marginPercent: 56.3,
        salesPrice: 5000,
        showOnSite: true,
        supplier: "ChemClean Solutions",
      },
      {
        item: "Metal Feeding Trough (large)",
        quantity: 25,
        unit: "piece",
        categoryId: categories[2]._id,
        categoryName: "Equipment",
        price: 12500,
        costPrice: 8500,
        marginPercent: 47.1,
        salesPrice: 12500,
        showOnSite: true,
        supplier: "Farm Equipment Co.",
      },
      {
        item: "Water Drinker System (automatic)",
        quantity: 15,
        unit: "set",
        categoryId: categories[2]._id,
        categoryName: "Equipment",
        price: 28000,
        costPrice: 18000,
        marginPercent: 55.6,
        salesPrice: 28000,
        showOnSite: true,
        supplier: "AgriTech Innovations",
      },
    ]);
    console.log(`✓ Created ${inventory.length} inventory items\n`);

    // Seed Services
    console.log("Seeding services...");
    const services = await Service.create([
      {
        name: "Veterinary Health Check-up",
        category: "Veterinary Services",
        description: "Comprehensive health examination for all livestock including vaccination status review, parasitic screening, and general wellness assessment.",
        price: 15000,
        unit: "per head",
        showOnSite: true,
        isActive: true,
        notes: "Includes basic lab work if needed",
      },
      {
        name: "Artificial Insemination (AI) Service",
        category: "Breeding Services",
        description: "Professional breeding services using quality genetics to improve herd performance and productivity.",
        price: 25000,
        unit: "per animal",
        showOnSite: true,
        isActive: true,
        notes: "Success rate 85%+, 30-day guarantee",
      },
      {
        name: "Feed Formulation & Consultation",
        category: "Feed & Nutrition",
        description: "Customized feed plans based on animal type, production stage, and available resources.",
        price: 30000,
        unit: "consultation",
        showOnSite: true,
        isActive: true,
        notes: "3-hour session inclusive of trial feed sample",
      },
      {
        name: "Farm Management Training",
        category: "Training & Consultation",
        description: "Comprehensive training on modern farm management practices, record keeping, biosecurity, and profitability.",
        price: 50000,
        unit: "per day",
        showOnSite: true,
        isActive: true,
        notes: "Up to 20 participants, practical demonstrations included",
      },
      {
        name: "Meat Processing & Packaging",
        category: "Processing & Value Addition",
        description: "Professional slaughtering, butchering, and vacuum packaging service for meat distribution.",
        price: 8000,
        unit: "per kg",
        showOnSite: true,
        isActive: true,
        notes: "HACCP certified facility",
      },
      {
        name: "Facility Design & Construction",
        category: "Equipment & Facilities",
        description: "Design and construction of modern poultry houses, dairy units, and livestock shelters.",
        price: 350000,
        unit: "per project",
        showOnSite: true,
        isActive: true,
        notes: "Includes site assessment and materials procurement",
      },
      {
        name: "Quality Livestock Sales & Sourcing",
        category: "Animal Sales",
        description: "Help sourcing quality breeding stock and replacement animals with guaranteed health status.",
        price: 45000,
        unit: "per transaction",
        showOnSite: true,
        isActive: true,
        notes: "30-day health guarantee on all animals",
      },
      {
        name: "Waste Management System Setup",
        category: "Waste Management",
        description: "Design and setup of sustainable waste management including composting and biogas systems.",
        price: 120000,
        unit: "per installation",
        showOnSite: true,
        isActive: true,
        notes: "Eco-friendly, generates additional income",
      },
    ]);
    console.log(`✓ Created ${services.length} services\n`);

    console.log("✅ Database seeding completed successfully!\n");
    console.log("Summary:");
    console.log(`- Locations: ${locations.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Animals: ${animals.length}`);
    console.log(`- Inventory Categories: ${categories.length}`);
    console.log(`- Inventory Items: ${inventory.length}`);
    console.log(`- Services: ${services.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  }
}

seedDatabase();
