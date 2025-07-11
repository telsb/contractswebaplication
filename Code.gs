// Replace these with your actual Google Sheets ID and Drive Folder ID
const SHEET_ID = 'YOUR_GOOGLE_SHEETS_ID_HERE';
const DRIVE_FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';

// Estate and Contract Type constants
const Estate = {
  LIMA: "LIMA Estate",
  BIZHUB: "BizHub", 
  TARI: "TARI Estate",
  MEZ2: "MEZ2 Estate",
  WEST_CEBU: "WEST CEBU Estate",
  ADMIN: "ADMIN",
  ALL: "ALL"
};

const ContractType = {
  LOI: "LOI",
  RA: "RA", 
  CTS: "CTS",
  DOAS: "DOAS",
  LTLA: "LTLA",
  OTHERS: "OTHERS"
};

function doPost(e) {
  try {
    // Enable CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (e && e.parameter && e.parameter.method === 'OPTIONS') {
      return ContentService
        .createTextOutput('')
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    // Parse the request
    let requestData;
    try {
      if (!e.postData || !e.postData.contents) {
        return createErrorResponse('No data received', headers);
      }
      requestData = JSON.parse(e.postData.contents);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return createErrorResponse('Invalid JSON in request', headers);
    }

    const { action, payload } = requestData;

    if (!action) {
      return createErrorResponse('Missing action parameter', headers);
    }

    console.log('Processing action:', action, 'with payload:', payload);

    // Route to appropriate handler
    let result;
    switch (action) {
      case 'create_account':
        result = handleCreateAccount(payload);
        break;
      case 'login':
        result = handleLogin(payload);
        break;
      case 'admin_login':
        result = handleAdminLogin(payload);
        break;
      case 'get_locators':
        result = handleGetLocators(payload);
        break;
      case 'add_locator':
        result = handleAddLocator(payload);
        break;
      case 'add_contract':
        result = handleAddContract(payload);
        break;
      default:
        return createErrorResponse(`Unknown action: ${action}`, headers);
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);

  } catch (error) {
    console.error('doPost error:', error);
    return createErrorResponse(`Server error: ${error.toString()}`, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    });
  }
}

function createErrorResponse(message, headers = {}) {
  const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'error',
      message: message
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({...defaultHeaders, ...headers});
}

function createSuccessResponse(data, message = 'Success') {
  return {
    status: 'success',
    data: data,
    message: message
  };
}

// Handle account creation
function handleCreateAccount(payload) {
  try {
    const { email, password } = payload;
    
    if (!email || !password) {
      return { status: 'error', message: 'Email and password are required' };
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID);
    const usersSheet = sheet.getSheetByName('users');
    
    if (!usersSheet) {
      return { status: 'error', message: 'Users sheet not found' };
    }

    // Check if user already exists
    const data = usersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === email) { // Email is in column B (index 1)
        return { status: 'error', message: 'User already exists' };
      }
    }

    // Generate new SSID
    const newSSID = 'SS' + (Date.now().toString().slice(-6));
    
    // Add new user (all estates set to FALSE initially)
    usersSheet.appendRow([newSSID, email, password, false, false, false, false, false]);
    
    return createSuccessResponse(
      { user: { email: email, ssid: newSSID } },
      'Account created successfully'
    );
    
  } catch (error) {
    console.error('Create account error:', error);
    return { status: 'error', message: 'Failed to create account: ' + error.toString() };
  }
}

// Handle user login
function handleLogin(payload) {
  try {
    const { email, password, estate } = payload;
    
    if (!email || !password || !estate) {
      return { status: 'error', message: 'Email, password, and estate are required' };
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID);
    const usersSheet = sheet.getSheetByName('users');
    
    if (!usersSheet) {
      return { status: 'error', message: 'Users sheet not found' };
    }

    const data = usersSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find estate column index
    const estateColumnMap = {
      [Estate.LIMA]: headers.indexOf('LIMA'),
      [Estate.BIZHUB]: headers.indexOf('BIZHUB'),
      [Estate.TARI]: headers.indexOf('TARI'),
      [Estate.MEZ2]: headers.indexOf('MEZ2'),
      [Estate.WEST_CEBU]: headers.indexOf('WEST_CEBU')
    };
    
    const estateColumnIndex = estateColumnMap[estate];
    if (estateColumnIndex === -1) {
      return { status: 'error', message: 'Invalid estate' };
    }

    // Find user and check credentials
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[1] === email && row[2] === password) { // Email and password columns
        // Check if user has access to this estate
        if (row[estateColumnIndex] === true || row[estateColumnIndex] === 'TRUE') {
          return createSuccessResponse(
            { user: { email: email, ssid: row[0], estate: estate } },
            'Login successful'
          );
        } else {
          return { status: 'error', message: `Access denied for ${estate}` };
        }
      }
    }
    
    return { status: 'error', message: 'Invalid email or password' };
    
  } catch (error) {
    console.error('Login error:', error);
    return { status: 'error', message: 'Login failed: ' + error.toString() };
  }
}

// Handle admin login
function handleAdminLogin(payload) {
  try {
    const { email, password } = payload;
    
    if (!email || !password) {
      return { status: 'error', message: 'Email and password are required' };
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID);
    const adminsSheet = sheet.getSheetByName('admins');
    
    if (!adminsSheet) {
      return { status: 'error', message: 'Admins sheet not found' };
    }

    const data = adminsSheet.getDataRange().getValues();
    
    // Check admin credentials
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === email && row[1] === password) { // Email and password columns
        return createSuccessResponse(
          { user: { email: email, role: 'admin' } },
          'Admin login successful'
        );
      }
    }
    
    return { status: 'error', message: 'Invalid admin credentials' };
    
  } catch (error) {
    console.error('Admin login error:', error);
    return { status: 'error', message: 'Admin login failed: ' + error.toString() };
  }
}

// Handle get locators
function handleGetLocators(payload) {
  try {
    const { estate } = payload || {};
    
    const sheet = SpreadsheetApp.openById(SHEET_ID);
    const locatorsSheet = sheet.getSheetByName('locators');
    const contractsSheet = sheet.getSheetByName('contracts');
    
    if (!locatorsSheet) {
      return { status: 'error', message: 'Locators sheet not found' };
    }
    
    if (!contractsSheet) {
      return { status: 'error', message: 'Contracts sheet not found' };
    }

    // Get locators data
    const locatorsData = locatorsSheet.getDataRange().getValues();
    const contractsData = contractsSheet.getDataRange().getValues();
    
    if (locatorsData.length <= 1) {
      return createSuccessResponse([], 'No locators found');
    }

    // Process locators
    const locators = [];
    for (let i = 1; i < locatorsData.length; i++) {
      const row = locatorsData[i];
      const locator = {
        LocatorID: row[0],
        Estate: row[1],
        LocatorName: row[2],
        Address: row[3],
        LotArea: row[4],
        IndustryType: row[5],
        contracts: []
      };
      
      // Filter by estate if specified
      if (estate && estate !== 'ALL' && locator.Estate !== estate) {
        continue;
      }
      
      // Get contracts for this locator
      for (let j = 1; j < contractsData.length; j++) {
        const contractRow = contractsData[j];
        if (contractRow[1] === locator.LocatorID) { // LocatorID match
          locator.contracts.push({
            ContractID: contractRow[0],
            contractType: contractRow[2],
            fileName: contractRow[3],
            fileURL: contractRow[5]
          });
        }
      }
      
      locators.push(locator);
    }
    
    return createSuccessResponse(locators, `Found ${locators.length} locators`);
    
  } catch (error) {
    console.error('Get locators error:', error);
    return { status: 'error', message: 'Failed to get locators: ' + error.toString() };
  }
}

// Handle add locator
function handleAddLocator(payload) {
  try {
    const { estate, locatorName, address, lotArea, industryType } = payload;
    
    if (!estate || !locatorName || !address || !lotArea || !industryType) {
      return { status: 'error', message: 'All fields are required' };
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID);
    const locatorsSheet = sheet.getSheetByName('locators');
    
    if (!locatorsSheet) {
      return { status: 'error', message: 'Locators sheet not found' };
    }

    // Generate new LocatorID
    const newLocatorID = 'LOC' + Date.now().toString().slice(-6);
    
    // Add new locator
    locatorsSheet.appendRow([newLocatorID, estate, locatorName, address, lotArea, industryType]);
    
    const newLocator = {
      LocatorID: newLocatorID,
      Estate: estate,
      LocatorName: locatorName,
      Address: address,
      LotArea: lotArea,
      IndustryType: industryType,
      contracts: []
    };
    
    return createSuccessResponse(
      { newLocator: newLocator },
      'Locator added successfully'
    );
    
  } catch (error) {
    console.error('Add locator error:', error);
    return { status: 'error', message: 'Failed to add locator: ' + error.toString() };
  }
}

// Handle add contract - FIXED VERSION
function handleAddContract(payload) {
  try {
    console.log('handleAddContract called with payload:', payload);
    
    const { locatorId, contractType, fileData } = payload;
    
    if (!locatorId || !contractType || !fileData) {
      console.error('Missing required fields:', { locatorId, contractType, fileData: !!fileData });
      return { status: 'error', message: 'LocatorId, contractType, and fileData are required' };
    }

    const { base64, name, type } = fileData;
    
    if (!base64 || !name) {
      console.error('File data incomplete:', { base64: !!base64, name, type });
      return { status: 'error', message: 'File data is incomplete' };
    }

    console.log('Creating file in Drive...');
    
    // Create file in Google Drive
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), type || 'application/pdf', name);
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const file = folder.createFile(blob);
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    const fileURL = `https://drive.google.com/file/d/${fileId}/view`;

    console.log('File created successfully:', { fileId, fileURL });

    // Add contract to sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID);
    const contractsSheet = sheet.getSheetByName('contracts');
    
    if (!contractsSheet) {
      return { status: 'error', message: 'Contracts sheet not found' };
    }

    const newContractID = 'CON' + Date.now().toString().slice(-6);
    contractsSheet.appendRow([newContractID, locatorId, contractType, name, fileId, fileURL]);
    
    console.log('Contract added to sheet:', newContractID);
    
    const newContract = {
      ContractID: newContractID,
      contractType: contractType,
      fileName: name,
      fileURL: fileURL
    };
    
    return createSuccessResponse(
      { newContract: newContract },
      'Contract uploaded successfully'
    );
    
  } catch (error) {
    console.error('Add contract error:', error);
    return { status: 'error', message: 'Failed to upload contract: ' + error.toString() };
  }
}

// Test function to verify setup
function testSetup() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID);
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    
    console.log('Sheet name:', sheet.getName());
    console.log('Folder name:', folder.getName());
    console.log('Setup is working correctly!');
    
    return 'Setup test passed';
  } catch (error) {
    console.error('Setup test failed:', error);
    return 'Setup test failed: ' + error.toString();
  }
}