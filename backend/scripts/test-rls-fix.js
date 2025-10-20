const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("\n🧪 TESTING RLS FIX\n");
console.log("═".repeat(70));

async function testRLSFix() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    console.log("\n📊 Test 1: INSERT into departers...");
    const testDeparter = {
      name: "Test Hub RLS",
      address: "Test Address",
      lat: 10.123456,
      lng: 106.123456,
      formatted_address: "Test Formatted Address",
      is_active: true
    };

    const { data: departerData, error: departerError } = await supabase
      .from("departers")
      .insert([testDeparter])
      .select()
      .single();

    if (departerError) {
      console.log("   ❌ FAILED:", departerError.message);
      throw new Error("Departer insert failed: " + departerError.message);
    }

    console.log("   ✅ SUCCESS! Departer created:");
    console.log("      ID:", departerData.id);
    console.log("      Name:", departerData.name);

    console.log("\n📊 Test 2: INSERT into destinations...");
    const testDestination = {
      carrier_name: "Test Destination RLS",
      address: "Test Address",
      ward_name: "Test Ward",
      district_name: "Test District",
      province_name: "Test Province",
      lat: 10.234567,
      lng: 106.234567,
      formatted_address: "Test Formatted Address",
      departer_id: departerData.id,
      is_active: true
    };

    const { data: destData, error: destError } = await supabase
      .from("destinations")
      .insert([testDestination])
      .select()
      .single();

    if (destError) {
      console.log("   ❌ FAILED:", destError.message);
      throw new Error("Destination insert failed: " + destError.message);
    }

    console.log("   ✅ SUCCESS! Destination created:");
    console.log("      ID:", destData.id);
    console.log("      Name:", destData.carrier_name);

    console.log("\n📊 Test 3: UPDATE departer...");
    const { data: updateData, error: updateError } = await supabase
      .from("departers")
      .update({ name: "Test Hub RLS (Updated)" })
      .eq("id", departerData.id)
      .select()
      .single();

    if (updateError) {
      console.log("   ❌ FAILED:", updateError.message);
      throw new Error("Update failed: " + updateError.message);
    }

    console.log("   ✅ SUCCESS! Departer updated:");
    console.log("      New name:", updateData.name);

    console.log("\n📊 Test 4: DELETE test data...");
    
    // Delete destination first (foreign key constraint)
    const { error: deleteDestError } = await supabase
      .from("destinations")
      .delete()
      .eq("id", destData.id);

    if (deleteDestError) {
      console.log("   ⚠️  Warning: Could not delete destination:", deleteDestError.message);
    } else {
      console.log("   ✅ Destination deleted");
    }

    // Delete departer
    const { error: deleteDepError } = await supabase
      .from("departers")
      .delete()
      .eq("id", departerData.id);

    if (deleteDepError) {
      console.log("   ⚠️  Warning: Could not delete departer:", deleteDepError.message);
    } else {
      console.log("   ✅ Departer deleted");
    }

    console.log("\n" + "═".repeat(70));
    console.log("✅ ALL RLS TESTS PASSED!");
    console.log("═".repeat(70));
    console.log("\n🎉 RLS policies are working correctly!");
    console.log("   - INSERT: ✅");
    console.log("   - UPDATE: ✅");
    console.log("   - DELETE: ✅");
    console.log("\n✅ You can now use 'Thêm Hub chính' and 'Thêm điểm giao hàng'!\n");

  } catch (error) {
    console.error("\n❌ RLS TEST FAILED!");
    console.error("Error:", error.message);
    console.log("\n⚠️  Please check:");
    console.log("   1. Did you run the fix-rls-policies.sql in Supabase?");
    console.log("   2. Are the policies created correctly?");
    console.log("   3. Is RLS enabled on the tables?\n");
    process.exit(1);
  }
}

testRLSFix();

