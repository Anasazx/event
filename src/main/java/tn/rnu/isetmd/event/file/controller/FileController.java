package tn.rnu.isetmd.event.file.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.rnu.isetmd.event.file.dto.FileUploadResponse;
import tn.rnu.isetmd.event.file.service.FileStorageService;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    FileUploadResponse upload(@RequestParam("file") MultipartFile file) {
        return fileStorageService.store(file);
    }

}
