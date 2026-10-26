package tn.rnu.isetmd.event.file.dto;

public record FileUploadResponse(
        String url,
        String filename,
        long size
) {}
