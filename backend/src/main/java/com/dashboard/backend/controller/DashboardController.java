package com.dashboard.backend.controller;

import com.dashboard.backend.dto.QueryRequest;
import com.dashboard.backend.entity.DataRow;
import com.dashboard.backend.entity.Dataset;
import com.dashboard.backend.service.DataService;
import com.dashboard.backend.service.OpenAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DataService dataService;
    
    @Autowired
    private OpenAiService openAiService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a valid CSV file");
        }
        try {
            Dataset dataset = dataService.processAndSaveCsv(file);
            return ResponseEntity.ok(dataset);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to process file: " + e.getMessage());
        }
    }

    @GetMapping("/datasets")
    public ResponseEntity<List<Dataset>> getAllDatasets() {
        return ResponseEntity.ok(dataService.getAllDatasets());
    }

    @GetMapping("/datasets/{id}/data")
    public ResponseEntity<List<DataRow>> getDatasetData(@PathVariable Long id) {
        return ResponseEntity.ok(dataService.getDatasetRows(id));
    }

    @PostMapping("/query")
    public ResponseEntity<?> queryData(@RequestBody QueryRequest request) {
        try {
            Dataset dataset = dataService.getAllDatasets().stream()
                .filter(d -> d.getId().equals(request.getDatasetId()))
                .findFirst().orElseThrow(() -> new RuntimeException("Dataset not found"));
            
            List<DataRow> dataRows = dataService.getDatasetRows(request.getDatasetId());
            
            String aiInsight = openAiService.getInsightFromData(dataset, dataRows, request.getQuery());
            return ResponseEntity.ok(aiInsight);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to process query: " + e.getMessage());
        }
    }
}
