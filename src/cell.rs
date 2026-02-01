/// 各セルの状態を表す列挙型
/// Number: 数字が入っているセル
/// Candidate: 候補が入っているセル(ビットマスクと候補の数)
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Number(u8),
    Candidate(u16, u8),
}

impl Cell {
    pub fn new_number(num: u8) -> Self {
        Cell::Number(num)
    }
    pub fn new_candidate(candidates: [bool; 9]) -> Self {
        let mut bitmask = 0u16;
        let mut count = 0u8;
        for (i, &is_candidate) in candidates.iter().enumerate() {
            if is_candidate {
                bitmask |= 1 << i;
                count += 1;
            }
        }
        Cell::Candidate(bitmask, count)
    }

    /// numberを候補から削除する。0~8の範囲内であることを仮定する。
    pub fn reduce_candidate(&mut self, num: u8) {
        if let Cell::Candidate(bitmask, count) = self {
            let mask = 1 << num;
            if (*bitmask & mask) != 0 {
                *bitmask &= !mask;
                *count -= 1;
            }
        }
    }
}
