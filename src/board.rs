use crate::cell::Cell;

/// 各セルがどのセルと関連しているかを示す定数
pub const RELATED_CELLS: [[usize; 20]; 81] = {
    let mut related = [[0; 20]; 81];
    let mut i = 0;
    while i < 81 {
        let row = i / 9;
        let col = i % 9;
        let block_row = (row / 3) * 3;
        let block_col = (col / 3) * 3;
        let mut idx = 0;
        let mut j = 0;
        while j < 9 {
            if j != col {
                related[i][idx] = row * 9 + j;
                idx += 1;
            }
            if j != row {
                related[i][idx] = j * 9 + col;
                idx += 1;
            }
            j += 1;
        }
        let mut block_i = 0;
        while block_i < 9 {
            let block_row_i = block_row + block_i / 3;
            let block_col_i = block_col + block_i % 3;
            if block_row_i != row && block_col_i != col {
                related[i][idx] = block_row_i * 9 + block_col_i;
                idx += 1;
            }
            block_i += 1;
        }
        i += 1;
    }
    related
};

/// 数独の盤面を表す構造体
#[derive(Clone, Debug)]
pub struct Board {
    cells: [Cell; 81],
}

impl Board {
    /// 新しい空の盤面を作成する
    /// input: 各セルの初期値を表す配列。Noneは空セル、Some(n)は数字nが入っているセルを表す。0~8の範囲内であることを仮定する。
    pub fn new(input: [Option<u8>; 81]) -> Option<Self> {
        let cells = input
            .iter()
            .enumerate()
            .map(|(i, &value)| {
                if let Some(num) = value {
                    Cell::new_number(num)
                } else {
                    // 候補を計算する
                    let mut candidates = [true; 9];
                    for &related_idx in RELATED_CELLS[i].iter() {
                        if let Some(n) = input[related_idx] {
                            candidates[n as usize] = false;
                        }
                    }
                    Cell::new_candidate(candidates)
                }
            })
            .collect::<Vec<Cell>>()
            .try_into()
            .unwrap();
        let board = Board { cells };
        if board.is_valid() { Some(board) } else { None }
    }

    pub fn is_valid(&self) -> bool {
        self.cells.iter().enumerate().all(|(i, cell)| {
            if let Cell::Number(num) = cell {
                RELATED_CELLS[i]
                    .iter()
                    .all(|&related_idx| self.cells[related_idx] != Cell::Number(*num))
            } else {
                true
            }
        })
    }

    /// 次に探索するべきセルのインデックスを取得する
    pub fn next_cell_index(&self) -> Option<usize> {
        let mut min_candidates = 10;
        let mut next_index = None;
        for (i, cell) in self.cells.iter().enumerate() {
            if let Cell::Candidate(_, count) = cell
                && *count < min_candidates
            {
                min_candidates = *count;
                next_index = Some(i);
            }
        }
        next_index
    }

    pub fn get_candidates(&self, index: usize) -> Option<[bool; 9]> {
        if let Cell::Candidate(bitmask, _) = self.cells[index] {
            let mut candidates = [false; 9];
            for (i, candidate) in candidates.iter_mut().enumerate() {
                *candidate = (bitmask & (1 << i)) != 0;
            }
            Some(candidates)
        } else {
            None
        }
    }

    pub fn set_number(&mut self, index: usize, num: u8) {
        self.cells[index] = Cell::new_number(num);
        for &related_idx in RELATED_CELLS[index].iter() {
            self.cells[related_idx].reduce_candidate(num);
        }
    }

    pub fn to_vec(&self) -> Option<Vec<u8>> {
        // 一つでも空セルがあればNoneを返す
        if self
            .cells
            .iter()
            .any(|cell| matches!(cell, Cell::Candidate(_, _)))
        {
            None
        } else {
            Some(
                self.cells
                    .iter()
                    .map(|cell| match cell {
                        Cell::Number(num) => *num + 1,
                        Cell::Candidate(_, _) => {
                            unreachable!("Empty cell found in to_vec")
                        }
                    })
                    .collect(),
            )
        }
    }
}

/// Boardを表示するためのフォーマットを実装
impl std::fmt::Display for Board {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for (i, cell) in self.cells.iter().enumerate() {
            match cell {
                Cell::Number(num) => write!(f, "{}", num + 1)?,
                Cell::Candidate(_, _) => write!(f, ".")?,
            }
            if (i + 1) % 3 == 0 {
                write!(f, "|")?;
            }
            if (i + 1) % 9 == 0 {
                writeln!(f)?;
                if (i + 1) % 27 == 0 {
                    writeln!(f, "------------")?;
                }
            }
        }
        Ok(())
    }
}
