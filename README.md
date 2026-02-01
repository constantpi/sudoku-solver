# sudoku-solver

簡易説明
- Rust で実装した数独ソルバー
- WebAssembly (wasm) にビルドして、ブラウザ上で動作させる例を含む

## 準備（開発マシン）

1. Rust と toolchain を用意（rustup）
2. wasm-pack をインストール
3. ローカルでビルドして確認

```bash
# プロジェクトルートで実行
wasm-pack build --target web --out-dir pkg
# Pages 用に pkg を docs にコピー
cp -r pkg docs/pkg
# ローカルで docs を配信して動作確認
python3 -m http.server --directory docs 8000
# ブラウザで http://localhost:8000 を開く
```

## 実装について
- 数独ソルバー本体は `src/lib.rs` に実装
- WebAssembly 用のバインディングは `wasm-bindgen` を使用
- ブラウザ側のコードは `docs/main.js` に実装
- `wasm-pack` を使ってビルドし、`docs/pkg` に出力
- `docs/index.html` でブラウザ上で動作させる例を提供

## ソルバーについて
- 候補の少ないマスから順に試行するバックトラック法を採用
    - 解けない場合も検出可能
- 再帰呼び出し回数をカウントして、性能評価に利用可能
- あるマスに仮置きしたとき、影響を与えるのは同じ行・列・ブロックのみであることを利用して高速化
    - すべての空きマスについて置ける候補を計算するのは最初の一度だけで済む
