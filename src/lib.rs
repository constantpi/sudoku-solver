use wasm_bindgen::prelude::*;

pub mod board;
mod cell;
pub mod solver;

use board::Board;
use solver::solve;

#[wasm_bindgen]
/// 0はNone、1-9は0-8としてエンコードされた81バイトの入力を受け取り、
/// 解決された場合は同様にエンコードされた81バイトのベクターを返す。
pub struct SolveResult {
    board: Option<Vec<u8>>,
    call_cnt: u32,
}

#[wasm_bindgen]
impl SolveResult {
    #[wasm_bindgen(getter)]
    pub fn board(&self) -> Option<Vec<u8>> {
        self.board.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn call_cnt(&self) -> u32 {
        self.call_cnt
    }

    #[wasm_bindgen(getter)]
    pub fn solved(&self) -> bool {
        self.board.is_some()
    }
}

#[wasm_bindgen]
pub fn solve_wasm(input: Vec<u8>) -> SolveResult {
    if input.len() != 81 {
        SolveResult {
            board: None,
            call_cnt: 0,
        }
    } else {
        let board_input: [Option<u8>; 81] = input
            .iter()
            .map(|&n| {
                if n == 0 {
                    None
                } else if (1..=9).contains(&n) {
                    Some(n - 1)
                } else {
                    return None;
                }
            })
            .collect::<Vec<Option<u8>>>()
            .try_into()
            .unwrap();
        // let board = Board::new(board_input);
        if let Some(board) = Board::new(board_input) {
            let mut call_cnt = 0;
            if let Some(solved_board) = solve(board, &mut call_cnt) {
                SolveResult {
                    board: solved_board.to_vec(),
                    call_cnt,
                }
            } else {
                SolveResult {
                    board: None,
                    call_cnt,
                }
            }
        } else {
            SolveResult {
                board: None,
                call_cnt: 0,
            }
        }
    }
}
