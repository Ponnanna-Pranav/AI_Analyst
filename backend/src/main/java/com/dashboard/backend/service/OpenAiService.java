package com.dashboard.backend.service;

import com.dashboard.backend.entity.DataRow;
import com.dashboard.backend.entity.Dataset;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OpenAiService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.api.model:gpt-3.5-turbo}")
    private String apiModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getInsightFromData(Dataset dataset, List<DataRow> dataRows, String userQuery) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "{\"summary\": \"OpenAI API key is missing. Please configure it in the backend.\", \"chartData\": []}";
        }

        // Limit data to prevent token exhaustion (max 100 rows for context)
        List<Map<String, String>> sampleData = dataRows.stream()
                .limit(100)
                .map(DataRow::getRowData)
                .collect(Collectors.toList());

        String dataJson = "";
        try {
            dataJson = objectMapper.writeValueAsString(sampleData);
        } catch (Exception e) {
            e.printStackTrace();
        }

        String systemPrompt = "You are an AI Data Analyst. You will be provided with a dataset sample (JSON format) and a user's question. " +
                "You must respond ONLY with a valid JSON object matching this structure: " +
                "{\"summary\": \"A short textual answer/insight summarizing the data\", " +
                "\"chartData\": [{\"label\": \"Category A\", \"value\": 10}, ...]}. " +
                "The chartData should be formatted appropriately for a bar chart or line chart to answer the user's question. " +
                "If the query cannot be plotted, return an empty array for chartData. " +
                "Do not include markdown blocks like ```json, just output the raw JSON.";

        String userPrompt = "Headers: " + dataset.getHeaders() + "\n" +
                "User Question: " + userQuery + "\n" +
                "Data Sample: " + dataJson;

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", apiModel);
        
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.2);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            Map<String, Object> response = restTemplate.postForObject(apiUrl, request, Map.class);
            
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("summary", "Error communicating with AI: " + e.getMessage());
            errorRes.put("chartData", new ArrayList<>());
            try {
                return objectMapper.writeValueAsString(errorRes);
            } catch (Exception ex) {
                return "{\"summary\": \"Error communicating with AI.\", \"chartData\": []}";
            }
        }
    }
}
