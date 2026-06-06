import { describe, expect, it } from 'vitest';
import { parse } from '../src/parser';

const EXAMPLES: { name: string; src: string; expectKind?: 'block'|'flow'|'seq'|'state' }[] = [
  { name: 'def basic', src: `10 = 制御装置 / control device
11 = CPU
12 = メモリ / memory` },
  { name: 'cont nested', src: `100 = システム
10 = サブシステムA
20 = サブシステムB
11 = 部品A1
12 = 部品A2
21 = 部品B1
100 : 10 20
10 : 11 12
20 : 21`,
    expectKind: 'block',
  },
  { name: 'all ops', src: `1 = A
2 = B
3 = C
1 - 2
1 -> 2
3 <- 2
1 <-> 3
1 .. 2
1 .> 2
1 => 2`,
  },
  { name: 'quoted labels', src: `13 = "I/O インターフェース" / "I/O interface"
14 = "比率 1:2" / "ratio 1:2"
15 = "型番 #ABC" / "Model #ABC"
16 = "計算: y = ax + b" / "y = ax + b"` },
  { name: 'block sample', expectKind: 'block', src: `10 = 制御装置 / control device
11 = CPU
12 = メモリ / memory
13 = "I/O インターフェース" / "I/O interface"
20 = 外部機器 / external device

10 : 11 12 13

11 -  12
11 -  13
13 -> 20 : 信号 / signal` },
  { name: 'flow sample', expectKind: 'flow', src: `S100 = 開始 / Start
S110 = 条件A? / "Condition A?"
S120 = 処理X / Process X
S130 = 処理Y / Process Y
S140 = 終了 / End

S100 -> S110
S110 -> S120 : Yes
S110 -> S130 : No
S120 -> S140
S130 -> S140` },
  { name: 'state sample', expectKind: 'state', src: `S1 = 待機 / Idle
S2 = 動作中 / Running
S3 = エラー / Error

*  -> S1
S1 -> S2 : 起動 / start
S2 -> S1 : 停止 / stop
S2 -> S3 : 異常 / fault
S3 -> S1 : リセット / reset
S3 -> *` },
  { name: 'seq sample', expectKind: 'seq', src: `100 = クライアント / client
200 = サーバ / server

100 -> 200 : 認証要求 / auth request
200 -> 100 : トークン / token
100 -> 200 : リソース要求 / resource request
200 -> 100 : リソース応答 / resource response` },
  { name: 'hierarchy', expectKind: 'block', src: `100 = システム / System
10 = サブシステムA / Subsystem A
20 = サブシステムB / Subsystem B
11 = 部品A1 / Part A1
12 = 部品A2 / Part A2
21 = 部品B1 / Part B1

100 : 10 20
10  : 11 12
20  : 21` },
  { name: 'pipeline', expectKind: 'flow', src: `S100 = 入力 / Input
S110 = 前処理 / Preprocess
S120 = 主処理 / Main Process
S130 = 後処理 / Postprocess
S140 = 出力 / Output

S100 -> S110
S110 -> S120
S120 -> S130
S130 -> S140` },
  { name: 'parallel', expectKind: 'flow', src: `S100 = 開始 / Start
S110 = 分岐 / Branch
S120 = 経路A / Path A
S130 = 経路B / Path B
S140 = 経路C / Path C
S150 = 合流 / Join
S160 = 終了 / End

S100 -> S110
S110 -> S120
S110 -> S130
S110 -> S140
S120 -> S150
S130 -> S150
S140 -> S150
S150 -> S160` },
  { name: 'handshake', expectKind: 'seq', src: `100 = 端末 / Terminal
200 = サーバ / Server

100 ->  200 : SYN要求 / SYN
200 ->  100 : SYN+ACK / SYN+ACK
100 ->  200 : ACK応答 / ACK
100 <-> 200 : データ交換 / data exchange
100 ->  200 : FIN / FIN
200 ->  100 : ACK / ACK` },
];

describe('Help reference examples', () => {
  for (const ex of EXAMPLES) {
    it(`parses cleanly: ${ex.name}`, () => {
      const doc = parse(ex.src);
      const errors = doc.diagnostics.filter(d => d.severity === 'error');
      expect(errors, `Errors found in ${ex.name}: ${JSON.stringify(errors)}`).toHaveLength(0);
      if (ex.expectKind) {
        expect(doc.kind).toBe(ex.expectKind);
      }
    });
  }
});
