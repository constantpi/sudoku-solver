use crate::board::Board;
/// 数独を解く関数
pub fn solve(board: Board) -> Option<Board> {
    if let Some(empty_idx) = board.next_cell_index() {
        if let Some(candidates) = board.get_candidates(empty_idx) {
            for (num, &is_candidate) in candidates.iter().enumerate() {
                if is_candidate {
                    // 仮にnumを入れてみる
                    let mut new_board = board.clone();
                    new_board.set_number(empty_idx, (num) as u8);
                    if let Some(solved_board) = solve(new_board) {
                        // 解けた
                        return Some(solved_board);
                    }
                }
            }
            // 全ての候補を試したが解けなかった場合
            None
        } else {
            // 空いてるセルはあるが入れるべき数字がない場合
            None
        }
    } else if board.is_valid() {
        // 解けた
        Some(board)
    } else {
        // 全部埋めたが不正解
        None
    }
}
