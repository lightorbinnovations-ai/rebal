import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Company } from "@/types/company";

interface BulkPropertyImportProps {
  company: Company;
  onImportComplete: () => void;
}

interface ColumnMapping {
  [fileColumn: string]: string;
}

interface ParsedRow {
  [key: string]: string | number | null;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// Property fields that can be mapped
const PROPERTY_FIELDS = [
  { key: "title", label: "Title", required: true },
  { key: "price", label: "Price", required: true },
  { key: "property_type", label: "Property Type", required: true },
  { key: "purpose", label: "Purpose (Sale/Rent)", required: true },
  { key: "location", label: "Location", required: false },
  { key: "address", label: "Address", required: false },
  { key: "description", label: "Description", required: false },
  { key: "status", label: "Status", required: false },
  { key: "main_image_url", label: "Main Image URL", required: false },
  { key: "features", label: "Features (comma-separated)", required: false },
  { key: "meta_title", label: "SEO Title", required: false },
  { key: "meta_description", label: "SEO Description", required: false },
  { key: "keywords", label: "Keywords (comma-separated)", required: false },
];

const VALID_PROPERTY_TYPES = [
  "Land",
  "Apartment",
  "Duplex",
  "Bungalow",
  "Terrace",
  "Semi-Detached",
  "Detached",
  "Commercial",
  "Office",
  "Shop",
  "Warehouse",
];

const VALID_PURPOSES = ["Sale", "Rent", "Lease"];
const VALID_STATUSES = ["Available", "Sold", "Reserved", "Under Offer"];

// Auto-mapping suggestions based on common column names
const AUTO_MAP_SUGGESTIONS: { [pattern: string]: string } = {
  title: "title",
  name: "title",
  property_name: "title",
  "property name": "title",
  price: "price",
  amount: "price",
  cost: "price",
  type: "property_type",
  property_type: "property_type",
  "property type": "property_type",
  purpose: "purpose",
  "for": "purpose",
  listing_type: "purpose",
  location: "location",
  city: "location",
  area: "location",
  address: "address",
  street: "address",
  description: "description",
  details: "description",
  status: "status",
  image: "main_image_url",
  image_url: "main_image_url",
  photo: "main_image_url",
  features: "features",
  amenities: "features",
  seo_title: "meta_title",
  meta_title: "meta_title",
  seo_description: "meta_description",
  meta_description: "meta_description",
  keywords: "keywords",
  tags: "keywords",
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50) + "-" + Math.random().toString(36).substring(2, 8);
}

export const BulkPropertyImport = ({
  company,
  onImportComplete,
}: BulkPropertyImportProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setFileColumns([]);
    setParsedData([]);
    setColumnMapping({});
    setValidationErrors([]);
    setImportProgress(0);
  };

  const handleFileUpload = useCallback((uploadedFile: File) => {
    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, { defval: "" });
        
        if (jsonData.length === 0) {
          toast({
            title: "Empty file",
            description: "The uploaded file contains no data.",
            variant: "destructive",
          });
          return;
        }

        const columns = Object.keys(jsonData[0]);
        setFileColumns(columns);
        setParsedData(jsonData);

        // Auto-map columns
        const autoMapping: ColumnMapping = {};
        columns.forEach((col) => {
          const normalizedCol = col.toLowerCase().replace(/[^a-z0-9]/g, "_");
          const suggestion = AUTO_MAP_SUGGESTIONS[normalizedCol] || AUTO_MAP_SUGGESTIONS[col.toLowerCase()];
          if (suggestion) {
            autoMapping[col] = suggestion;
          }
        });
        setColumnMapping(autoMapping);
        setStep("mapping");
      } catch (error) {
        toast({
          title: "Failed to parse file",
          description: "Could not read the file. Please ensure it's a valid CSV or Excel file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(uploadedFile);
  }, [toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
        handleFileUpload(droppedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive",
        });
      }
    },
    [handleFileUpload, toast]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const updateMapping = (fileColumn: string, propertyField: string) => {
    setColumnMapping((prev) => {
      const newMapping = { ...prev };
      if (propertyField === "none") {
        delete newMapping[fileColumn];
      } else {
        newMapping[fileColumn] = propertyField;
      }
      return newMapping;
    });
  };

  const validateData = (): boolean => {
    const errors: ValidationError[] = [];
    const requiredFields = PROPERTY_FIELDS.filter((f) => f.required).map((f) => f.key);
    const mappedFields = Object.values(columnMapping);

    // Check if all required fields are mapped
    const missingRequired = requiredFields.filter((f) => !mappedFields.includes(f));
    if (missingRequired.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please map these required fields: ${missingRequired.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    // Validate each row
    parsedData.forEach((row, index) => {
      const mappedRow = getMappedRow(row);

      // Check required fields have values
      requiredFields.forEach((field) => {
        if (!mappedRow[field] || String(mappedRow[field]).trim() === "") {
          errors.push({
            row: index + 2, // +2 for header and 0-index
            field,
            message: `${field} is required`,
          });
        }
      });

      // Validate price is a number
      if (mappedRow.price && isNaN(Number(mappedRow.price))) {
        errors.push({
          row: index + 2,
          field: "price",
          message: "Price must be a number",
        });
      }

      // Validate property type
      if (mappedRow.property_type && !VALID_PROPERTY_TYPES.includes(String(mappedRow.property_type))) {
        errors.push({
          row: index + 2,
          field: "property_type",
          message: `Invalid property type. Valid: ${VALID_PROPERTY_TYPES.join(", ")}`,
        });
      }

      // Validate purpose
      if (mappedRow.purpose && !VALID_PURPOSES.includes(String(mappedRow.purpose))) {
        errors.push({
          row: index + 2,
          field: "purpose",
          message: `Invalid purpose. Valid: ${VALID_PURPOSES.join(", ")}`,
        });
      }

      // Validate status if provided
      if (mappedRow.status && !VALID_STATUSES.includes(String(mappedRow.status))) {
        errors.push({
          row: index + 2,
          field: "status",
          message: `Invalid status. Valid: ${VALID_STATUSES.join(", ")}`,
        });
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const getMappedRow = (row: ParsedRow): ParsedRow => {
    const mappedRow: ParsedRow = {};
    Object.entries(columnMapping).forEach(([fileCol, propField]) => {
      mappedRow[propField] = row[fileCol];
    });
    return mappedRow;
  };

  const handleProceedToPreview = () => {
    if (validateData()) {
      setStep("preview");
    }
  };

  const handleImport = async () => {
    setStep("importing");
    setImportProgress(0);

    const total = parsedData.length;
    let imported = 0;
    let failed = 0;

    for (const row of parsedData) {
      const mappedRow = getMappedRow(row);
      
      try {
        const propertyData = {
          company_id: company.id,
          title: String(mappedRow.title || "").trim(),
          slug: generateSlug(String(mappedRow.title || "")),
          price: Number(mappedRow.price) || 0,
          property_type: String(mappedRow.property_type || "Land"),
          purpose: String(mappedRow.purpose || "Sale"),
          location: mappedRow.location ? String(mappedRow.location).trim() : null,
          address: mappedRow.address ? String(mappedRow.address).trim() : null,
          description: mappedRow.description ? String(mappedRow.description).trim() : null,
          status: VALID_STATUSES.includes(String(mappedRow.status)) ? String(mappedRow.status) : "Available",
          main_image_url: mappedRow.main_image_url ? String(mappedRow.main_image_url).trim() : null,
          features: mappedRow.features 
            ? String(mappedRow.features).split(",").map(f => f.trim()).filter(Boolean)
            : null,
          meta_title: mappedRow.meta_title ? String(mappedRow.meta_title).trim() : null,
          meta_description: mappedRow.meta_description ? String(mappedRow.meta_description).trim() : null,
          keywords: mappedRow.keywords
            ? String(mappedRow.keywords).split(",").map(k => k.trim()).filter(Boolean)
            : null,
          is_active: true,
        };

        const { error } = await supabase.from("properties").insert(propertyData);
        
        if (error) throw error;
        imported++;
      } catch (error) {
        console.error("Failed to import row:", error);
        failed++;
      }

      setImportProgress(Math.round(((imported + failed) / total) * 100));
    }

    toast({
      title: "Import complete",
      description: `Successfully imported ${imported} properties. ${failed > 0 ? `${failed} failed.` : ""}`,
      variant: failed > 0 ? "default" : "default",
    });

    setIsOpen(false);
    resetState();
    onImportComplete();
  };

  const getMappedFields = () => Object.values(columnMapping);
  const requiredFieldsMapped = PROPERTY_FIELDS
    .filter((f) => f.required)
    .every((f) => getMappedFields().includes(f.key));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import Properties
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import Properties from File"}
            {step === "mapping" && "Map Columns to Fields"}
            {step === "preview" && "Preview Import"}
            {step === "importing" && "Importing Properties..."}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV or Excel file containing your property data."}
            {step === "mapping" && "Match your file columns to property fields."}
            {step === "preview" && `Review ${parsedData.length} properties before importing.`}
            {step === "importing" && "Please wait while we import your properties."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Upload Step */}
          {step === "upload" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports CSV, XLS, and XLSX files
              </p>
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" type="button">
                Select File
              </Button>
            </div>
          )}

          {/* Mapping Step */}
          {step === "mapping" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{file?.name}</span>
                <Badge variant="secondary">{parsedData.length} rows</Badge>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {fileColumns.map((col) => {
                    const mappedTo = columnMapping[col];
                    const fieldInfo = PROPERTY_FIELDS.find((f) => f.key === mappedTo);
                    
                    return (
                      <div
                        key={col}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{col}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            Sample: {String(parsedData[0]?.[col] || "").substring(0, 50)}
                          </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Select
                          value={mappedTo || "none"}
                          onValueChange={(value) => updateMapping(col, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">Don't import</span>
                            </SelectItem>
                            {PROPERTY_FIELDS.map((field) => {
                              const isUsed = getMappedFields().includes(field.key) && mappedTo !== field.key;
                              return (
                                <SelectItem
                                  key={field.key}
                                  value={field.key}
                                  disabled={isUsed}
                                >
                                  {field.label}
                                  {field.required && " *"}
                                  {isUsed && " (used)"}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {mappedTo && (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {!requiredFieldsMapped && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please map all required fields: Title, Price, Property Type, and Purpose
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4">
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {validationErrors.length} validation errors found. Please fix your data and try again.
                  </AlertDescription>
                </Alert>
              )}

              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((row, index) => {
                      const mapped = getMappedRow(row);
                      const rowErrors = validationErrors.filter((e) => e.row === index + 2);
                      const hasErrors = rowErrors.length > 0;

                      return (
                        <TableRow
                          key={index}
                          className={hasErrors ? "bg-destructive/10" : ""}
                        >
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {String(mapped.title || "-")}
                          </TableCell>
                          <TableCell>{String(mapped.price || "-")}</TableCell>
                          <TableCell>{String(mapped.property_type || "-")}</TableCell>
                          <TableCell>{String(mapped.purpose || "-")}</TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {String(mapped.location || "-")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {String(mapped.status || "Available")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {parsedData.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Showing first 50 of {parsedData.length} properties
                  </p>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium mb-2">Importing properties...</p>
              <p className="text-muted-foreground mb-4">{importProgress}% complete</p>
              <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {step !== "importing" && (
          <DialogFooter className="flex-shrink-0">
            {step === "upload" && (
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            )}
            {step === "mapping" && (
              <>
                <Button variant="outline" onClick={resetState}>
                  Back
                </Button>
                <Button
                  onClick={handleProceedToPreview}
                  disabled={!requiredFieldsMapped}
                >
                  Preview Import
                </Button>
              </>
            )}
            {step === "preview" && (
              <>
                <Button variant="outline" onClick={() => setStep("mapping")}>
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validationErrors.length > 0}
                >
                  Import {parsedData.length} Properties
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
