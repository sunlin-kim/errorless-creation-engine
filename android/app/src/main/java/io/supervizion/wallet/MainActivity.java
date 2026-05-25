package io.supervizion.wallet;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

/**
 * 보안 정책 (P0): FLAG_SECURE 적용.
 * - 화면 캡처/녹화 차단 (시드, 비밀번호, QR 노출 방지)
 * - 최근 앱(Recents) 썸네일에서 잔상 제거
 *
 * 추가: WalletConnect deep link 처리
 *  - "wc:abc...@2?..."          → WebView 를 /connect?uri=wc:... 로 이동
 *  - "supervizion://wc?uri=wc:..." → 같은 경로
 *  Intent 는 launchMode="singleTask" + onNewIntent 로 전달됨.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        handleWcIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWcIntent(intent);
    }

    private void handleWcIntent(Intent intent) {
        if (intent == null || intent.getData() == null) return;
        Uri data = intent.getData();
        String scheme = data.getScheme();
        String wcUri = null;
        if ("wc".equalsIgnoreCase(scheme)) {
            wcUri = data.toString();
        } else if ("supervizion".equalsIgnoreCase(scheme)) {
            // supervizion://wc?uri=...
            if ("wc".equalsIgnoreCase(data.getHost())) {
                wcUri = data.getQueryParameter("uri");
            }
        }
        if (wcUri == null || wcUri.isEmpty()) return;

        final String encoded = Uri.encode(wcUri);
        final WebView webView = this.bridge != null ? this.bridge.getWebView() : null;
        if (webView == null) return;
        webView.post(new Runnable() {
            @Override
            public void run() {
                // Capacitor origin 은 https://localhost (capacitor.config.ts 의 hostname 으로 고정).
                webView.loadUrl("https://localhost/connect?uri=" + encoded);
            }
        });
    }
}
