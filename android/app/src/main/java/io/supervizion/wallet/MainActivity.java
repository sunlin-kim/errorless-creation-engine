package io.supervizion.wallet;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

/**
 * 보안 정책 (P0): FLAG_SECURE 적용.
 * - 화면 캡처/녹화 차단 (시드, 비밀번호, QR 노출 방지)
 * - 최근 앱(Recents) 썸네일에서 잔상 제거
 *
 * Non-custodial wallet 의 기본 방어선이며, 사용자가 직접 끌 수 없도록
 * 네이티브 단에서 강제한다.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
    }
}
