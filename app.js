const API_URL = "https://script.google.com/macros/s/AKfycbwXk1AMNTJnAo_IzNtkvmeBmg1ScSnZXwTsAZuRJwKsO6GtiycFuaQHyyrQsLxxxfLc/exec";

let inventoryData=[],salesData=[],suppliersData=[],profitData=[];
let editInventoryRow=null,editSupplierRow=null,editSaleRow=null;
let selectedProfitDate="";
let expenseData=[];
let selectedProfitMonth="";
let accessoriesData=[];
let selectedAccessoryDate="";
let selectedSalesDate="";
let selectedSalesMonth="";
let rows=salesData.map(s=>s.values);
let selectedSupplierDate="";
let selectedSupplierMonth="";
let editExpenseRow = null;
let editAccessoryRow = null;


/* ================= UTIL ================= */

function $(id){ return document.getElementById(id); }

function showMessage(msg,color="green"){
 const m=$("message");
 m.style.color=color;
 m.innerText=msg;
 setTimeout(()=>m.innerText="",2500);
}

function confirmDelete(sheet, row){
 if(confirm("Are you sure you want to delete this record?")){
  send(sheet, "delete", { row });
 }
}

function showTab(id){
 document.querySelectorAll(".tab").forEach(t=>t.classList.add("hidden"));
 $(id).classList.remove("hidden");
 if(id==="sales") loadInventoryList();
}

/* ================= NORMALIZE (SEARCH FIX) ================= */

function normalize(value){
 return String(value || "")
   .toLowerCase()
   .replace(/\s+/g,"")
   .trim();
}

/* ================= SAFE DATE ================= */

function safeDate(value){
 if(!value) return "";
 if(typeof value==="string" && value.includes("-"))
   return value.split("T")[0];
 return String(value);
}

/* ================= FETCH ================= */

async function fetchAllData(){
 const res=await fetch(API_URL);
 const data=await res.json();

 inventoryData=data.inventory.rows.map((r,i)=>({sheetRow:i+2,values:r}));
 salesData=data.sales.rows.map((r,i)=>({sheetRow:i+2,values:r}));
 suppliersData=data.suppliers.rows.map((r,i)=>({sheetRow:i+2,values:r}));
 profitData=data.profit.rows.map((r,i)=>({sheetRow:i+2,values:r}));
 expenseData=data.expense.rows.map((r,i)=>({sheetRow:i+2,values:r}));
 accessoriesData=data.accessories.rows.map((r,i)=>({sheetRow:i+2,values:r}));

 renderAll();
}

function renderAll(){
 renderInventory();
 renderSales();
 renderSuppliers();
 renderProfit();
 renderExpense();
 renderAccessories();
}

async function send(sheet,action,payload){
 const res=await fetch(`${API_URL}?sheet=${sheet}&action=${action}`,{
  method:"POST",
  headers:{"Content-Type":"text/plain"},
  body:JSON.stringify(payload)
 });

 const json=await res.json();

 if(json.status!=="success"){
   return showMessage(json.message,"red");
 }

 await fetchAllData();

 // ✅ Success messages
 if(action === "delete"){
   showMessage("Deleted successfully");
 }
 else if(action === "add"){
   showMessage("Saved successfully");
 }
 else if(action === "update"){
   showMessage("Updated successfully");
 }
}

/* ================= INVENTORY ================= */

function submitInventory(){
 const name=$("invName").value.trim();
 const specs=$("invSpecs").value.trim();
 const price=$("invBuy").value;
 const pieces=$("invPieces").value;
 const buyer=$("invBuyer").value.trim();

 if(!name||!specs||!price||!pieces||!buyer)
  return showMessage("Fill all inventory fields","red");

 const payload=[name,specs,Number(price),Number(pieces),buyer];

 if(editInventoryRow){
  send("Inventory","update",{row:editInventoryRow,values:payload});
  editInventoryRow=null;
 }else{
  send("Inventory","add",payload);
 }

 clearInventoryForm();
}

function renderInventory(data=null,highlight=false){
 const list = data || inventoryData;
$("inventoryTable").innerHTML="";

let totalPieces = 0;

 if(list.length===0){
   $("inventoryTable").innerHTML =
     `<tr><td colspan="6">No matching results</td></tr>`;
   return;
 }

 list.forEach(i=>{
  const r=i.values;
  totalPieces += Number(r[3] || 0);
  const pieces = Number(r[3] || 0);

  // 🔥 If pieces = 0 → highlight red
  let rowClass = "";
  if(pieces === 0){
    rowClass = "out-of-stock";
  } 
  else if(highlight){
    rowClass = "highlight";
  }

  $("inventoryTable").innerHTML+=`
  <tr class="${rowClass}">
   <td>${r[0]}</td>
   <td>${r[1]}</td>
   <td>${r[2]}</td>
   <td>${r[3]}</td>
   <td>${r[4]}</td>
   <td>
    <button onclick="startInventoryEdit(${i.sheetRow})">Edit</button>
 <button class="btn-danger"
 onclick="confirmDelete('Inventory', ${i.sheetRow})">Delete</button>
   </td>
  </tr>`;
 });
if($("inventoryTotalPieces")){
  $("inventoryTotalPieces").innerText = totalPieces;
}
}

function searchInventory(){
 const keyword = $("inventorySearch").value.trim();
 if(!keyword) return renderInventory();

 const keyNorm = normalize(keyword);

 const filtered = inventoryData.filter(i =>
   i.values.some(cell =>
     normalize(cell).includes(keyNorm)
   )
 );

 renderInventory(filtered, true);
}

function clearInventorySearch(){
 $("inventorySearch").value="";
 renderInventory();
}

function startInventoryEdit(row){
 const item=inventoryData.find(i=>i.sheetRow===row);
 const r=item.values;
 $("invName").value=r[0];
 $("invSpecs").value=r[1];
 $("invBuy").value=r[2];
 $("invPieces").value=r[3];
 $("invBuyer").value=r[4];
 editInventoryRow=row;
}

function clearInventoryForm(){
 $("invName").value="";
 $("invSpecs").value="";
 $("invBuy").value="";
 $("invPieces").value="";
 $("invBuyer").value="";
}

/* ================= SALES ================= */

function submitSale(){
 const date=$("saleDate").value;
 const cust=$("custName").value.trim();
 const phone=$("custPhone").value.trim();
 const item=$("saleItem").value;
 const sell=$("sellPrice").value;
 const extra=$("saleExtra").value.trim(); // STRING

 if(!date||!cust||!phone||!item||!sell)
  return showMessage("Fill all sales fields","red");

 const payload=[date,cust,phone,item,Number(sell),extra];

 if(editSaleRow){
  send("Sales","update",{row:editSaleRow,values:payload});
  editSaleRow=null;
 }else{
  send("Sales","add",payload);
 }

 clearSaleForm();
}

function renderSales(){

 $("salesTable").innerHTML="";

 let rows=salesData.map(s=>s.values);

 if(selectedSalesDate)
  rows=rows.filter(r=>safeDate(r[0])===selectedSalesDate);

 if(selectedSalesMonth)
  rows=rows.filter(r=>safeDate(r[0]).startsWith(selectedSalesMonth));

 rows.forEach(r=>{

  const item=salesData.find(s=>s.values===r);

  $("salesTable").innerHTML+=`
  <tr>
   <td>${safeDate(r[0])}</td>
   <td>${r[1]}</td>
   <td>${r[2]}</td>
   <td>${r[3]}</td>
   <td>${r[4]}</td>
   <td>${r[5]}</td>
   <td>${r[6]}</td>
   <td>${r[7]}</td>
   <td>
    <button onclick="startSaleEdit(${item.sheetRow})">Edit</button>
   <button class="btn-danger"
 onclick="confirmDelete('Sales', ${item.sheetRow})">Delete</button>
   </td>
  </tr>`;
 });

}

function startSaleEdit(row){
 const item=salesData.find(i=>i.sheetRow===row);
 const r=item.values;
 $("saleDate").value=safeDate(r[0]);
 $("custName").value=r[1];
 $("custPhone").value=r[2];
 $("sellPrice").value=r[4];
 editSaleRow=row;
}

function clearSaleForm(){
 $("saleDate").value="";
 $("custName").value="";
 $("custPhone").value="";
 $("sellPrice").value="";
 $("saleExtra").value="";
}

function loadInventoryList(){
 $("saleItem").innerHTML="";
 inventoryData.filter(i=>i.values[3]>0)
  .forEach(i=>$("saleItem").innerHTML+=`<option>${i.values[0]}</option>`);
}

function filterSales(){
 selectedSalesMonth="";
 selectedSalesDate=$("salesDate").value;
 renderSales();
}

function filterSalesMonth(){
 selectedSalesDate="";
 selectedSalesMonth=$("salesMonth").value;
 renderSales();
}

function clearSalesFilter(){
 selectedSalesDate="";
 selectedSalesMonth="";
 $("salesDate").value="";
 $("salesMonth").value="";
 renderSales();
}

/* ================= SUPPLIERS ================= */

/* ================= SUPPLIERS ================= */

function autoCalculateTotal(){
  const pieces = Number($("supPieces").value || 0);
  const price = Number($("supSinglePrice").value || 0);
  $("supTotal").value = pieces * price;
}

function submitSupplier(){
  const date = $("supDate").value;
  const supplier = $("supName").value.trim();
  const phone = $("supPhone").value.trim();
  const product = $("supProduct").value.trim();
  const specs = $("supSpecs").value.trim();
  const pieces = $("supPieces").value;
  const price = $("supSinglePrice").value;
  const total = $("supTotal").value;
  const paid = $("supPaid").value;

  if(!date || !supplier || !phone || !product || !specs || !pieces || !price || paid === ""){
    return showMessage("Please fill all supplier fields", "red");
  }

  const left = Number(total) - Number(paid);

  const payload = [
    date,
    supplier,
    phone,
    product,
    specs,
    Number(pieces),
    Number(price),
    Number(total),
    Number(paid),
    left
  ];

  if(editSupplierRow){
    send("Suppliers", "update", { row: editSupplierRow, values: payload });
    editSupplierRow = null;
    $("supplierFormTitle").innerText = "Add Supplier Purchase";
    $("supplierSaveBtn").innerText = "Save Supplier";
  } else {
    send("Suppliers", "add", payload);
  }

  clearSupplierForm();
}

function getFilteredSuppliers(){
  let list = suppliersData;

  const keyword = $("supplierSearch") ? $("supplierSearch").value.trim() : "";
  const selectedDate = $("supplierDate") ? $("supplierDate").value : "";
  const selectedMonth = $("supplierMonth") ? $("supplierMonth").value : "";

  if(keyword){
    const keyNorm = normalize(keyword);

    list = list.filter(i => {
      return i.values.some(cell => normalize(cell).includes(keyNorm));
    });
  }

  if(selectedDate){
    list = list.filter(i => safeDate(i.values[0]) === selectedDate);
  }

  if(selectedMonth){
    list = list.filter(i => safeDate(i.values[0]).startsWith(selectedMonth));
  }

  return list.sort((a, b) => {
    const da = new Date(safeDate(a.values[0]) || "1900-01-01");
    const db = new Date(safeDate(b.values[0]) || "1900-01-01");
    return db - da;
  });
}

function renderSupplierSummary(list){
  let totalPurchases = 0;
  let totalPaid = 0;
  let totalLeft = 0;

  list.forEach(i => {
    const r = i.values;
    totalPurchases += Number(r[7] || 0);
    totalPaid += Number(r[8] || 0);
    totalLeft += Number(r[9] || 0);
  });

  if($("supplierTotalPurchases")) $("supplierTotalPurchases").innerText = totalPurchases;
  if($("supplierTotalPaid")) $("supplierTotalPaid").innerText = totalPaid;
  if($("supplierTotalLeft")) $("supplierTotalLeft").innerText = totalLeft;
}

function renderSuppliers(){
  updateSupplierNamesList();
renderSupplierBalance();
  const list = getFilteredSuppliers();

  $("suppliersTable").innerHTML = "";

  renderSupplierSummary(list);

  if(list.length === 0){
    $("suppliersTable").innerHTML =
      `<tr><td colspan="11">No supplier records found</td></tr>`;
    return;
  }

  list.forEach(i => {
    const r = i.values;
    const left = Number(r[9] || 0);
    const leftClass = left > 0 ? "balance-left" : "balance-clear";

    $("suppliersTable").innerHTML += `
      <tr>
        <td>${safeDate(r[0])}</td>
        <td>${r[1]}</td>
        <td>${r[2]}</td>
        <td>${r[3]}</td>
        <td>${r[4]}</td>
        <td>${r[5]}</td>
        <td>${r[6]}</td>
        <td>${r[7]}</td>
        <td>${r[8]}</td>
        <td class="${leftClass}">${r[9]}</td>
        <td>
          <button onclick="startSupplierEdit(${i.sheetRow})">Edit</button>
          <button class="btn-danger" onclick="confirmDelete('Suppliers', ${i.sheetRow})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function searchSupplier(){
  renderSuppliers();
}

function clearSupplierSearch(){
  $("supplierSearch").value = "";
  renderSuppliers();
}

function startSupplierEdit(row){
  const item = suppliersData.find(i => i.sheetRow === row);
  if(!item) return;

  const r = item.values;

  $("supDate").value = safeDate(r[0]);
  $("supName").value = r[1];
  $("supPhone").value = r[2];
  $("supProduct").value = r[3];
  $("supSpecs").value = r[4];
  $("supPieces").value = r[5];
  $("supSinglePrice").value = r[6];
  $("supTotal").value = r[7];
  $("supPaid").value = r[8];

  editSupplierRow = row;

  $("supplierFormTitle").innerText = "Edit Supplier Purchase";
  $("supplierSaveBtn").innerText = "Update Supplier";

  document.getElementById("suppliers").scrollIntoView({ behavior: "smooth" });
}

function clearSupplierForm(){
  $("supDate").value = "";
  $("supName").value = "";
  $("supPhone").value = "";
  $("supProduct").value = "";
  $("supSpecs").value = "";
  $("supPieces").value = "";
  $("supSinglePrice").value = "";
  $("supTotal").value = "";
  $("supPaid").value = "";

  editSupplierRow = null;

  if($("supplierFormTitle")) $("supplierFormTitle").innerText = "Add Supplier Purchase";
  if($("supplierSaveBtn")) $("supplierSaveBtn").innerText = "Save Supplier";
}

function filterSupplier(){
  $("supplierMonth").value = "";
  renderSuppliers();
}

function filterSupplierMonth(){
  $("supplierDate").value = "";
  renderSuppliers();
}

function clearSupplierFilter(){
  $("supplierSearch").value = "";
  $("supplierDate").value = "";
  $("supplierMonth").value = "";
  renderSuppliers();
}
function updateSupplierNamesList(){
  const list = $("supplierNamesList");
  if(!list) return;

  const names = [...new Set(
    suppliersData
      .map(i => String(i.values[1] || "").trim())
      .filter(Boolean)
  )].sort();

  list.innerHTML = "";

  names.forEach(name => {
    list.innerHTML += `<option value="${name}"></option>`;
  });
}

function renderSupplierBalance(){
  const selectedName = $("supplierBalanceName")
    ? $("supplierBalanceName").value.trim()
    : "";

  if(!selectedName){
    if($("selectedSupplierLeft")) $("selectedSupplierLeft").innerText = "0";
    return;
  }

  const selectedNorm = normalize(selectedName);

  const totalLeft = suppliersData
    .filter(i => normalize(i.values[1]) === selectedNorm)
    .reduce((sum, i) => sum + Number(i.values[9] || 0), 0);

  $("selectedSupplierLeft").innerText = totalLeft;
}
/* ================= PROFIT ================= */

function filterProfit(){
 selectedProfitMonth = "";
 selectedProfitDate = $("profitDate").value;

 if(!selectedProfitDate)
  return showMessage("Select a date first","red");

 renderProfit();
}

function clearProfitFilter(){
 selectedProfitDate = "";
 selectedProfitMonth = "";
 $("profitDate").value = "";
 $("profitMonth").value = "";
 renderProfit();
}

function renderProfit(){
 $("profitTable").innerHTML = "";

 let rows = profitData.map(p => p.values);

 if(selectedProfitDate)
  rows = rows.filter(r => safeDate(r[0]) === selectedProfitDate);

 if(selectedProfitMonth)
  rows = rows.filter(r => safeDate(r[0]).startsWith(selectedProfitMonth));

 if(rows.length === 0){
  $("profitTable").innerHTML =
   `<tr><td colspan="2">No profit data found</td></tr>`;
  return;
 }

 let total = 0;

 rows.forEach(r => {
  total += Number(r[1] || 0);

  $("profitTable").innerHTML += `
   <tr>
    <td>${safeDate(r[0])}</td>
    <td>${r[1]}</td>
   </tr>`;
 });

 $("profitTable").innerHTML += `
  <tr style="font-weight:bold;background:#f3f4f6">
   <td>Total</td>
   <td>${total}</td>
  </tr>`;
}

/* ================= EXPENSE ================= */

let selectedExpenseDate="";
let selectedExpenseMonth="";

function submitExpense(){

 const date=$("expDate").value;
 const desc=$("expDesc").value.trim();
 const amount=$("expAmount").value;

 if(!date || !desc || !amount)
  return showMessage("Fill all expense fields","red");

 const payload = [date, desc, Number(amount)];

 if(editExpenseRow){
  send("Expense", "update", { row: editExpenseRow, values: payload });
  editExpenseRow = null;
 } else {
  send("Expense", "add", payload);
 }

 clearExpenseForm();
}

function clearExpenseForm(){
 $("expDate").value = "";
 $("expDesc").value = "";
 $("expAmount").value = "";
}


function renderExpense(){
 $("expenseTable").innerHTML = "";

 let list = expenseData;

 if(selectedExpenseDate){
  list = list.filter(e => safeDate(e.values[0]) === selectedExpenseDate);
 }

 if(selectedExpenseMonth){
  list = list.filter(e => safeDate(e.values[0]).startsWith(selectedExpenseMonth));
 }

 if(list.length === 0){
  $("expenseTable").innerHTML =
   `<tr><td colspan="4">No expense found</td></tr>`;
  return;
 }

 let total = 0;

 list.forEach(e => {
  const r = e.values;
  total += Number(r[2] || 0);

  $("expenseTable").innerHTML += `
  <tr>
   <td>${safeDate(r[0])}</td>
   <td>${r[1]}</td>
   <td>${r[2]}</td>
   <td>
    <button onclick="startExpenseEdit(${e.sheetRow})">Edit</button>
   <button class="btn-danger"
 onclick="confirmDelete('Expense', ${e.sheetRow})">Delete</button>
   </td>
  </tr>`;
 });

 $("expenseTable").innerHTML += `
 <tr style="font-weight:bold;background:#f3f4f6">
  <td colspan="2">Total</td>
  <td>${total}</td>
  <td></td>
 </tr>`;
}

function startExpenseEdit(row){
 const item = expenseData.find(i => i.sheetRow === row);
 if(!item) return;

 const r = item.values;
 $("expDate").value = safeDate(r[0]);
 $("expDesc").value = r[1];
 $("expAmount").value = r[2];
 editExpenseRow = row;
}

function filterExpense(){
 selectedExpenseMonth="";
 selectedExpenseDate=$("expenseDate").value;
 renderExpense();
}

function filterExpenseMonth(){
 selectedExpenseDate="";
 selectedExpenseMonth=$("expenseMonth").value;
 renderExpense();
}

function clearExpenseFilter(){
 selectedExpenseDate="";
 selectedExpenseMonth="";
 $("expenseDate").value="";
 $("expenseMonth").value="";
 renderExpense();
}

function filterProfitMonth(){
 selectedProfitDate = "";
 selectedProfitMonth = $("profitMonth").value;

 if(!selectedProfitMonth)
  return showMessage("Select a month first","red");

 renderProfit();
}
/* ================= ACCESSORIES ================= */

function submitAccessory(){
 const date = $("accDate").value;
 const type = $("accType").value.trim();
 const amount = $("accAmount").value;

 if(!date || !type || !amount)
  return showMessage("Fill all fields","red");

 const payload = [date, type, Number(amount)];

 if(editAccessoryRow){
  send("Accessories", "update", { row: editAccessoryRow, values: payload });
  editAccessoryRow = null;
 } else {
  send("Accessories", "add", payload);
 }

 clearAccessoryForm();
}

function clearAccessoryForm(){
 $("accDate").value = "";
 $("accType").value = "";
 $("accAmount").value = "";
}

function renderAccessories(){
 $("accessoriesTable").innerHTML = "";

 let list = accessoriesData;

 if(selectedAccessoryDate)
  list = list.filter(a => safeDate(a.values[0]) === selectedAccessoryDate);

 if(list.length === 0){
  $("accessoriesTable").innerHTML =
   `<tr><td colspan="4">No data</td></tr>`;
  return;
 }

 list.forEach(a => {
  const r = a.values;

  $("accessoriesTable").innerHTML += `
  <tr>
   <td>${safeDate(r[0])}</td>
   <td>${r[1]}</td>
   <td>${r[2]}</td>
   <td>
    <button onclick="startAccessoryEdit(${a.sheetRow})">Edit</button>
  <button class="btn-danger"
 onclick="confirmDelete('Accessories', ${a.sheetRow})">Delete</button>
   </td>
  </tr>`;
 });
}

function startAccessoryEdit(row){
 const item = accessoriesData.find(i => i.sheetRow === row);
 if(!item) return;

 const r = item.values;
 $("accDate").value = safeDate(r[0]);
 $("accType").value = r[1];
 $("accAmount").value = r[2];
 editAccessoryRow = row;
}

function filterAccessory(){

 selectedAccessoryDate=$("accessoryDate").value;

 if(!selectedAccessoryDate)
  return showMessage("Select a date","red");

 renderAccessories();
}

function clearAccessoryFilter(){

 selectedAccessoryDate="";
 $("accessoryDate").value="";
 renderAccessories();
}

window.onload=fetchAllData;
