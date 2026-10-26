package tn.rnu.isetmd.event.file.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.rnu.isetmd.event.common.exception.BadRequestException;
import tn.rnu.isetmd.event.file.dto.FileUploadResponse;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * Stores uploaded images on the local disk. Behind this service the storage
 * could be swapped for an object store (S3, MinIO...) without touching the callers.
 */
@Slf4j
@Service
public class FileStorageService {

    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private final Path uploadDir;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not create upload directory " + this.uploadDir, e);
        }
    }

    public FileUploadResponse store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("The file is empty");
        }

        String extension = ALLOWED_TYPES.get(file.getContentType());
        if (extension == null) {
            throw new BadRequestException("Only JPEG, PNG, WEBP and GIF images are allowed");
        }

        // Never trust the client file name: a random name prevents path traversal and collisions
        String filename = UUID.randomUUID() + extension;
        Path target = uploadDir.resolve(filename);

        try (InputStream input = file.getInputStream()) {
            Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to store upload", e);
            throw new UncheckedIOException("Failed to store file", e);
        }

        return new FileUploadResponse("/uploads/" + filename, filename, file.getSize());
    }
}
