package com.diumed.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int CAMERA_MIC_PERMISSION_REQUEST = 100;
    private PermissionRequest pendingPermissionRequest;

    @Override
    public void onStart() {
        super.onStart();

        // Override WebChromeClient to handle camera/mic permission requests
        // from getUserMedia() inside the WebView properly on Android
        WebView webView = this.getBridge().getWebView();
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                pendingPermissionRequest = request;

                String[] androidPermissions = new String[]{
                    Manifest.permission.CAMERA,
                    Manifest.permission.RECORD_AUDIO
                };

                boolean cameraGranted = ContextCompat.checkSelfPermission(
                    MainActivity.this, Manifest.permission.CAMERA
                ) == PackageManager.PERMISSION_GRANTED;

                boolean micGranted = ContextCompat.checkSelfPermission(
                    MainActivity.this, Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED;

                if (cameraGranted && micGranted) {
                    // Both already granted — allow immediately
                    request.grant(request.getResources());
                    pendingPermissionRequest = null;
                } else {
                    // Request the missing permissions from the user (shows native dialog)
                    ActivityCompat.requestPermissions(
                        MainActivity.this,
                        androidPermissions,
                        CAMERA_MIC_PERMISSION_REQUEST
                    );
                }
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == CAMERA_MIC_PERMISSION_REQUEST && pendingPermissionRequest != null) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }

            if (allGranted) {
                pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
            } else {
                pendingPermissionRequest.deny();
            }
            pendingPermissionRequest = null;
        }
    }
}
