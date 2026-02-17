const mongoose = require('mongoose');

const url = 'mongodb+srv://helloayoola_db_user:hgZYQPICwVlQkrbi@basefile.1enuwue.mongodb.net/?appName=BaseFile';

mongoose.connect(url).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    const db = mongoose.connection.db;
    
    // Check raw animal count
    const total = await db.collection('animals').countDocuments();
    console.log('\n=== Animal Count ===');
    console.log('Total animals in DB:', total);
    
    // Check alive animals
    const alive = await db.collection('animals').countDocuments({ status: 'Alive' });
    console.log('Alive animals:', alive);
    
    // Check Alive + not archived + has price
    const filtered = await db.collection('animals').countDocuments({
      status: 'Alive',
      isArchived: { $ne: true },
      projectedSalesPrice: { $gt: 0 }
    });
    console.log('Alive + not archived + has price:', filtered);
    
    // Get a sample
    console.log('\n=== Sample Animal ===');
    const sample = await db.collection('animals').findOne({
      status: 'Alive',
      isArchived: { $ne: true },
      projectedSalesPrice: { $gt: 0 }
    });
    
    if (sample) {
      console.log('Found sample:');
      console.log('- ID:', sample._id);
      console.log('- Name:', sample.name);
      console.log('- Species:', sample.species);
      console.log('- Status:', sample.status);
      console.log('- IsArchived:', sample.isArchived);
      console.log('- Price:', sample.projectedSalesPrice);
    } else {
      console.log('No animals found matching filter');
      
      // Check what fields exist
      console.log('\n=== Checking first animal in DB ===');
      const first = await db.collection('animals').findOne();
      if (first) {
        console.log('First animal fields:', Object.keys(first).sort());
        console.log('Status value:', first.status, 'Type:', typeof first.status);
        console.log('IsArchived value:', first.isArchived, 'Type:', typeof first.isArchived);
        console.log('ProjectedSalesPrice:', first.projectedSalesPrice, 'Type:', typeof first.projectedSalesPrice);
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await mongoose.disconnect();
  console.log('\nDisconnected');
  process.exit(0);
}).catch(err => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
