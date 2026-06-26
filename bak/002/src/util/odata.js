/**
 * Utility library to handle parsing of OData $metadata XML payloads.
 */

/**
 * Extracts available EntitySets from a raw OData XML metadata string.
 * @param {string} xmlString - Raw XML content from the $metadata endpoint
 * @returns {string[]} Array of discovered entity set names
 */
export function parseODataMetadata(xmlString) {
  if (!xmlString) return [];
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    
    // Check for explicit XML parsing failure indicators
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.warn("[ODATA PARSER] XML structure contains compilation layout anomalies.");
    }

    const entitySetElements = xmlDoc.getElementsByTagName("EntitySet");
    const discoveredSets = [];

    for (let i = 0; i < entitySetElements.length; i++) {
      const nameAttr = entitySetElements[i].getAttribute("Name");
      if (nameAttr) {
        discoveredSets.push(nameAttr);
      }
    }

    return discoveredSets;
  } catch (error) {
    console.error("[ODATA PARSER ERROR] Failed to navigate XML nodes:", error);
    return [];
  }
}

/**
 * Parses XML metadata to extract type constraints and validation metadata rules for a specific entity type.
 * 
 * @param {string} xmlString - Raw XML content from the $metadata endpoint
 * @param {string} entityName - Target entity collection name (e.g. 'PurchaseOrderItem')
 * @returns {Object} Dictionary of field validation rules indexed by field name
 */
export function parseEntityValidationRules(xmlString, entityName) {
  if (!xmlString) return {};

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // 1. Locate the EntitySet block to extract its underlying EntityType reference string
    const entitySets = xmlDoc.getElementsByTagName("EntitySet");
    let targetTypeNamespace = "";

    for (let i = 0; i < entitySets.length; i++) {
      if (entitySets[i].getAttribute("Name") === entityName) {
        targetTypeNamespace = entitySets[i].getAttribute("EntityType") || "";
        break;
      }
    }

    // Isolate the bare short name of the EntityType (strips namespaces if present)
    const typeShortName = targetTypeNamespace.substring(targetTypeNamespace.lastIndexOf('.') + 1);

    // 2. Locate matching EntityType Name block
    const entityTypes = xmlDoc.getElementsByTagName("EntityType");
    let targetEntityElement = null;

    for (let j = 0; j < entityTypes.length; j++) {
      const currentTypeName = entityTypes[j].getAttribute("Name");
      if (currentTypeName === typeShortName || currentTypeName === entityName) {
        targetEntityElement = entityTypes[j];
        break;
      }
    }

    if (!targetEntityElement) {
      console.warn(`[ODATA PARSER] EntityType schema node not found for entity: ${entityName}`);
      return {};
    }

    // 3. Loop through individual Property tags to extract field-level constraints
    const propertyElements = targetEntityElement.getElementsByTagName("Property");
    const validationRules = {};

    for (let k = 0; k < propertyElements.length; k++) {
      const prop = propertyElements[k];
      const propName = prop.getAttribute("Name");

      if (propName) {
        const typeAttr = prop.getAttribute("Type") || "";
        const nullableAttr = prop.getAttribute("Nullable");
        const maxLengthAttr = prop.getAttribute("MaxLength");
        const precisionAttr = prop.getAttribute("Precision");
// Inside the property loop of parseEntityValidationRules in src/util/odata.js:
validationRules[propName] = {
  type: typeAttr, // Exposes e.g. "Edm.Boolean", "Edm.Guid"
  isNumeric: typeAttr.includes("Int") || typeAttr.includes("Decimal") || typeAttr.includes("Double"),
  required: nullableAttr === "false", 
  maxLength: maxLengthAttr ? parseInt(maxLengthAttr, 10) : null,
  precision: precisionAttr ? parseInt(precisionAttr, 10) : null
};
      }
    }

    return validationRules;
  } catch (error) {
    console.error("[ODATA PARSER ERROR] Schema evaluation aborted:", error);
    return {};
  }
}

