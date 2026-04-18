package com.dashboard.backend.repository;

import com.dashboard.backend.entity.DataRow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataRowRepository extends JpaRepository<DataRow, Long> {
    List<DataRow> findByDatasetId(Long datasetId);
}
