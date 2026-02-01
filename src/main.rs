use wasm_bindgen::prelude::*;

mod board;
mod cell;
mod solver;

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

fn main() {
    // samplesディレクトリにある*.txtファイルを順に読み込む
    let paths = std::fs::read_dir("samples").unwrap();
    for path in paths {
        let path = path.unwrap().path();
        if path.extension().and_then(|s| s.to_str()) == Some("txt") {
            println!("Solving {:?}", path);
            let content = std::fs::read_to_string(&path).unwrap();
            let input: [Option<u8>; 81] = content
                .lines()
                .flat_map(|line| {
                    line.chars()
                        .map(|c| match c.to_digit(10) {
                            // あとの処理のために1-9を0-8に変換しておく
                            Some(n) if (1..=9).contains(&n) => Some(n as u8 - 1),
                            _ => None,
                        })
                        .collect::<Vec<Option<u8>>>()
                })
                .collect::<Vec<Option<u8>>>()
                .try_into()
                .unwrap();
            let board = board::Board::new(input);
            if let Some(solved_board) = solve(board) {
                println!("Solved board:\n{}", solved_board);
            } else {
                println!("No solution found for {:?}", path);
            }
        }
    }
}
