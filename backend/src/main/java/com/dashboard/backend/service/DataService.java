package com.dashboard.backend.service;

import com.dashboard.backend.entity.DataRow;
import com.dashboard.backend.entity.Dataset;
import com.dashboard.backend.repository.DataRowRepository;
import com.dashboard.backend.repository.DatasetRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DataService {

    @Autowired
    private DatasetRepository datasetRepository;

    @Autowired
    private DataRowRepository dataRowRepository;

    @Transactional
    public Dataset processAndSaveCsv(MultipartFile file) throws Exception {
        // Create new dataset
        Dataset dataset = new Dataset();
        dataset.setFilename(file.getOriginalFilename());
        dataset.setUploadedAt(LocalDateTime.now());
        
        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(fileReader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {
            
            List<String> headers = csvParser.getHeaderNames();
            dataset.setHeaders(String.join(",", headers));
            
            // Save dataset first to get ID
            dataset = datasetRepository.save(dataset);
            
            List<DataRow> rows = new ArrayList<>();
            Iterable<CSVRecord> csvRecords = csvParser.getRecords();
            for (CSVRecord csvRecord : csvRecords) {
                Map<String, String> rowMap = csvRecord.toMap();
                DataRow dataRow = new DataRow();
                dataRow.setDatasetId(dataset.getId());
                dataRow.setRowData(rowMap);
                rows.add(dataRow);
            }
            
            dataRowRepository.saveAll(rows);
            return dataset;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage());
        }
    }

    public List<Dataset> getAllDatasets() {
        return datasetRepository.findAll();
    }

    public List<DataRow> getDatasetRows(Long datasetId) {
        return dataRowRepository.findByDatasetId(datasetId);
    }
}
