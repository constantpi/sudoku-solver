use wasm_bindgen::prelude::*;

pub mod board;
mod cell;
pub mod solver;

use board::Board;
use solver::solve;

#[wasm_bindgen]
/// 0はNone、1-9は0-8としてエンコードされた81バイトの入力を受け取り、
/// 解決された場合は同様にエンコードされた81バイトのベクターを返す。
pub fn solve_wasm(input: Vec<u8>) -> Option<Vec<u8>> {
    if input.len() != 81 {
        None
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
        let board = Board::new(board_input);
        if let Some(solved_board) = solve(board) {
            solved_board.to_vec()
        } else {
            None
        }
    }
}
