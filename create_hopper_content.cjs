// create_hopper_content.cjs
// Run from project root: node scratch/create_hopper_content.cjs
'use strict';

async function main() {
  const { createClient } = await import('@supabase/supabase-js');

  const SUPABASE_URL = 'https://idxviqopiywzxbmuwtrz.supabase.co';
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE_KEY) {
    console.error('ERROR: Set $env:SUPABASE_SERVICE_ROLE_KEY before running this script.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Step 1: check table exists
  console.log('Checking hopper_content table...');
  const { data: chk, error: chkErr } = await supabase
    .from('hopper_content').select('id').limit(1);

  if (chkErr) {
    console.log('Table check error code:', chkErr.code, chkErr.message);
    if (chkErr.code === '42P01') {
      console.error('ERROR: Table does not exist. Create it in Supabase SQL editor first.');
      process.exit(1);
    }
    // ignore other errors and try inserting
  } else {
    console.log('Table exists. Proceeding.');
  }

  // Step 2: delete existing rows
  console.log('Clearing existing rows...');
  await supabase.from('hopper_content').delete().gte('created_at', '2000-01-01');

  // Step 3: location_info rows (plain ASCII only - no emoji, no em dash, no smart chars)
  const locationRows = [
    { stop_name:'The Pointe',lat:27.9393,lng:-82.4484,radius_m:150,content_type:'location_info',title:'The Pointe - Harbour Island',body:'You are at the southern tip of Harbour Island. The water on both sides is Hillsborough Bay. On a clear day you can see all the way to the Sunshine Skyway.',cta_text:'Book a Guided Tour',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'The Roundabout',lat:27.9420,lng:-82.4489,radius_m:150,content_type:'location_info',title:'Harbour Island Roundabout',body:"The entry point to Harbour Island. Developed in the 1980s on what was once an industrial waterfront. Today one of Tampa's most sought-after addresses.",cta_text:'Book a Guided Tour',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Tampa Theatre',lat:27.9474,lng:-82.4588,radius_m:150,content_type:'location_info',title:'Tampa Theatre - Est. 1926',body:"One of America's most beautiful movie palaces. Built in 1926 in Mediterranean Revival style with a stunning interior sky ceiling. Still operating today with films, concerts, and special events.",cta_text:'Hear more Tampa history',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Curtis Hixon Waterfront Park',lat:27.9466,lng:-82.4607,radius_m:150,content_type:'location_info',title:'Curtis Hixon Waterfront Park',body:"Tampa's premier downtown park stretching along the Hillsborough River. Host to major festivals with views of the University of Tampa's famous minarets across the water.",cta_text:'Book a Full Tampa Tour',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Straz Center',lat:27.9489,lng:-82.4614,radius_m:150,content_type:'location_info',title:'Straz Center for the Performing Arts',body:'One of the largest performing arts complexes in the Southeast. Nine acres on the Hillsborough River featuring Broadway shows, opera, ballet, and over 600,000 visitors every year.',cta_text:'Explore Tampa arts',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Cotanchobee Fort Brooke Park',lat:27.9449,lng:-82.4571,radius_m:150,content_type:'location_info',title:'Cotanchobee Fort Brooke Park',body:"Named after the Tocobaga word for Hillsborough River. Fort Brooke was established here in 1824 - the military post that became the city of Tampa. You are standing at the birthplace of modern Tampa.",cta_text:'Hear the founding story',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Snow Park',lat:27.9412,lng:-82.4556,radius_m:100,content_type:'location_info',title:'Snow Park',body:"Named after Major Henry E. Snow in 1921. Recognized by the Guinness Book of World Records as one of the world's smallest parks. You could almost miss it.",cta_text:'More hidden Tampa gems',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Sparkman Wharf',lat:27.9384,lng:-82.4489,radius_m:150,content_type:'location_info',title:'Sparkman Wharf',body:"Tampa's waterfront gathering place on Garrison Channel. Shipping containers converted into restaurants and bars with waterfront views and the Port of Tampa just across the water.",cta_text:null,cta_url:null,active:true},
    { stop_name:'Florida Aquarium',lat:27.9393,lng:-82.4472,radius_m:150,content_type:'location_info',title:'Florida Aquarium',body:"Home to over 20,000 aquatic animals and plants. The building was designed to look like a seashell from above. One of Tampa's most visited attractions.",cta_text:'Book a guided tour',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Amalie Arena',lat:27.9428,lng:-82.4516,radius_m:150,content_type:'location_info',title:'Amalie Arena',body:'Home of the Tampa Bay Lightning. Capacity 21,500. Also hosts major concerts and events. One of the busiest arenas in the Southeast.',cta_text:null,cta_url:null,active:true},
    { stop_name:'Tampa Bay History Center',lat:27.9407,lng:-82.4501,radius_m:150,content_type:'location_info',title:'Tampa Bay History Center',body:'Covers 400 years of Tampa Bay history including the Tocobaga people, Spanish explorers, Cuban cigar workers, and the boom years that built modern Tampa.',cta_text:'Hear the stories live',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Dick Greco Plaza Streetcar Stop',lat:27.9415,lng:-82.4548,radius_m:150,content_type:'location_info',title:'Dick Greco Plaza',body:"Named after Tampa's longest-serving mayor who championed bringing the TECO streetcar back to Tampa. His statue sits just outside the station.",cta_text:'Tampa history on wheels',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Publix - Water Street',lat:27.9406,lng:-82.4527,radius_m:150,content_type:'location_info',title:'Water Street Tampa',body:"A major urban development that transformed Tampa's waterfront. The first WELL-certified city district in the world - designed for health and wellbeing from the ground up.",cta_text:null,cta_url:null,active:true},
    { stop_name:'Ybor City Archway - 7th Ave',lat:27.9606,lng:-82.4390,radius_m:150,content_type:'location_info',title:'Welcome to Ybor City',body:"You have arrived in the neighborhood that put Tampa on the map. At its peak in the early 1900s Ybor City was the cigar capital of the world built by Cuban, Spanish, and Italian immigrants.",cta_text:'Hear the full Ybor story',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Centro Ybor',lat:27.9600,lng:-82.4369,radius_m:150,content_type:'location_info',title:'Centro Ybor',body:"The heart of Ybor City's entertainment district. Built on the site of former cigar factories. The Visitor Information Center here is the best starting point for exploring the historic district.",cta_text:null,cta_url:null,active:true},
    { stop_name:'Gas Worx',lat:27.9556,lng:-82.4422,radius_m:150,content_type:'location_info',title:'Gas Worx - Ybor City',body:"Tampa's newest mixed-use development connecting Ybor City to downtown. Phase 1 opened 2024. When complete it will add hundreds of residences and new retail to the Ybor corridor.",cta_text:null,cta_url:null,active:true},
    { stop_name:'Hyde Park Village',lat:27.9390,lng:-82.4756,radius_m:150,content_type:'location_info',title:'Hyde Park Village',body:"Tampa's original upscale neighborhood developed in the 1890s. The village shopping district has been a gathering place for over a century with some of the most beautiful craftsman bungalows in Florida.",cta_text:'Book a Hyde Park tour',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Gasparilla Pirate Ship Dock',lat:27.9282,lng:-82.4682,radius_m:150,content_type:'location_info',title:'The Jose Gasparilla Pirate Ship',body:"Home port of the world's only fully rigged pirate ship. Every January it leads the Gasparilla Invasion, Tampa's most celebrated festival. A Tampa tradition dating back over 100 years.",cta_text:'Hear the Gasparilla legend',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Howard & Azeele - Publix',lat:27.9373,lng:-82.4836,radius_m:150,content_type:'location_info',title:'SoHo - South Howard Avenue',body:"Tampa's most vibrant dining and nightlife corridor. South Howard Avenue runs through the heart of Hyde Park with over 50 restaurants and bars within walking distance.",cta_text:null,cta_url:null,active:true},
    { stop_name:"Bern's Park",lat:27.9336,lng:-82.4836,radius_m:150,content_type:'location_info',title:"Bern's Park - SoHo",body:"Named after Bern Laxer, founder of Bern's Steakhouse - one of America's most celebrated restaurants just steps away. Known for one of the largest private wine collections in the world.",cta_text:'More Tampa food culture',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Davis Islands Village',lat:27.9214,lng:-82.4528,radius_m:150,content_type:'location_info',title:'Davis Islands',body:"Developed in the 1920s by D.P. Davis who dredged these islands from Tampa Bay. Today one of Tampa's most exclusive addresses, also home to Tampa General Hospital and a small general aviation airport.",cta_text:'Tampa real estate history',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Tampa General Hospital',lat:27.9235,lng:-82.4499,radius_m:150,content_type:'location_info',title:'Tampa General Hospital',body:"One of the nation's leading academic medical centers located on Davis Islands. Level I Trauma Center serving all of Tampa Bay.",cta_text:null,cta_url:null,active:true},
    { stop_name:'Armature Works',lat:27.9590,lng:-82.4648,radius_m:150,content_type:'location_info',title:'Armature Works - Tampa Heights',body:"Built in 1910 as a streetcar repair facility. Now Tampa's most celebrated food hall with restaurants, a rooftop bar, and sweeping Hillsborough River views. The original brick and industrial bones are preserved.",cta_text:'Hear the full story',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'Water Works Park',lat:27.9601,lng:-82.4629,radius_m:150,content_type:'location_info',title:'Water Works Park',body:"Built on the site of Tampa's original 1890s water treatment facility. The historic pump house still stands. Now a riverfront park connecting Armature Works to the Riverwalk.",cta_text:null,cta_url:null,active:true},
    { stop_name:'Julian B. Lane Riverfront Park',lat:27.9583,lng:-82.4668,radius_m:150,content_type:'location_info',title:'Julian B. Lane Riverfront Park',body:"Tampa's largest riverfront park - over 20 acres along the Hillsborough River. Home to the city's kayak launch and some of the best sunset views in Tampa Heights.",cta_text:'Book a sunset tour',cta_url:'https://tours.citytourguide.app',active:true},
  ];

  const ctgRows = [
    { stop_name:'ALL',lat:0,lng:0,radius_m:0,content_type:'ctg',title:'Ask your driver about Tampa',body:'Your driver can share local history, food stops, photo spots, and tour options along the way.',cta_text:'See Guided Tours',cta_url:'https://tours.citytourguide.app',active:true},
    { stop_name:'ALL',lat:0,lng:0,radius_m:0,content_type:'ctg',title:'Ask your driver anything',body:'Your driver is a Tampa native and local guide. Every stop has a story - just ask.',cta_text:null,cta_url:null,active:true},
    { stop_name:'ALL',lat:0,lng:0,radius_m:0,content_type:'ctg',title:'Tip your driver',body:'Gratuity goes 100% to your driver. Every dollar supports local Tampa.',cta_text:null,cta_url:null,active:true},
    { stop_name:'ALL',lat:0,lng:0,radius_m:0,content_type:'ctg',title:'Enjoying your hop?',body:'Leave us a review on Google - it means everything to a small local business.',cta_text:'Leave a Review ->',cta_url:'https://maps.app.goo.gl/eCWEvUwCbrFnbwjo6',active:true},
    { stop_name:'ALL',lat:0,lng:0,radius_m:0,content_type:'ctg',title:'Plan your next hop',body:'Schedule a ride in advance and we will confirm your pickup time.',cta_text:'Schedule a Ride ->',cta_url:'https://hopper.citytourguide.app/request?type=scheduled',active:true},
  ];


  const allRows = [...locationRows, ...ctgRows];
  console.log(`Inserting ${allRows.length} rows...`);

  const { data: inserted, error: insErr } = await supabase
    .from('hopper_content')
    .insert(allRows)
    .select('id');

  if (insErr) {
    console.error('Insert error:', JSON.stringify(insErr, null, 2));
    process.exit(1);
  }
  console.log('[OK] Inserted ' + inserted.length + ' rows.');

  const { count } = await supabase
    .from('hopper_content')
    .select('*', { count: 'exact', head: true });
  console.log(`Total rows in hopper_content: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
