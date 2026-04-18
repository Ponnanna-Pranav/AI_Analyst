package com.dashboard.backend.dto;

import lombok.Data;

@Data
public class QueryRequest {
    private Long datasetId;
    private String query;
}
