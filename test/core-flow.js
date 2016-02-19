describe('Flow control', () => {

  describe('prepare_nested', () => {
    // This is not ideal because the function
    // is not tested directly. However, the function
    // is not public, so it's difficult to test
    // directly

    var p, a, b
    beforeEach(() => {
      p = new lab.Sequence()
      a = new lab.BaseElement()
      b = new lab.BaseElement()
    })

    it('distributes hand-me-downs', () => {
      p.foo = 'bar'
      b.foo = 'baz'

      p.content = [a, b]
      p.hand_me_downs.push('foo')

      p.prepare()

      assert.equal(a.foo, 'bar')
      assert.equal(b.foo, 'baz')
    })

    it('sets parent attribute', () => {
      p.content = [a, b]
      p.prepare()

      assert.equal(a.parent, p)
      assert.equal(b.parent, p)
    })

    it('sets id attribute', () => {
      p.content = [a, b]
      p.prepare()

      assert.equal(a.id, '0')
      assert.equal(b.id, '1')
    })

    it('runs prepare on nested elements', () => {
      p.content = [a, b]

      let a_prepare = sinon.spy()
      let b_prepare = sinon.spy()
      a.on('prepare', a_prepare)
      b.on('prepare', b_prepare)

      assert.notOk(a_prepare.calledOnce)
      assert.notOk(b_prepare.calledOnce)

      p.prepare()

      assert.ok(a_prepare.calledOnce)
      assert.ok(b_prepare.calledOnce)
    })
  })

  describe('Sequence', () => {

    var s
    beforeEach(() => {
      s = new lab.Sequence([], {})
    })

    it('runs elements in sequence', () => {
      // Setup sequence
      let a = new lab.BaseElement()
      let b = new lab.BaseElement()
      s.content = [a, b]

      // Setup spys
      let a_run = sinon.spy()
      let b_run = sinon.spy()
      a.on('run', a_run)
      b.on('run', b_run)
      let s_end = sinon.spy()
      s.on('end', s_end)

      // Prepare sequence
      s.prepare()
      assert.notOk(a_run.called)
      assert.notOk(b_run.called)

      // Run
      // A goes first
      s.run()
      assert.ok(a_run.calledOnce)
      assert.notOk(b_run.called)
      // B follows
      a.end()
      assert.ok(a_run.calledOnce)
      assert.ok(b_run.calledOnce)
      // We're not done yet
      assert.notOk(s_end.called)
      // The sequence ends
      b.end()
      // By now, each element should
      // have run once and the sequence
      // should have ended automatically
      assert.ok(a_run.calledOnce)
      assert.ok(b_run.calledOnce)
      assert.ok(s_end.calledOnce)
    })
  })

  describe('Parallel', () => {

    var p, a, b
    beforeEach(() => {
      a = new lab.BaseElement()
      b = new lab.BaseElement()
      p = new lab.Parallel([a, b], {})
    })

    it('runs elements in parallel', () => {
      let a_run = sinon.spy()
      let b_run = sinon.spy()
      a.on('run', a_run)
      b.on('run', b_run)

      p.prepare()

      assert.notOk(a_run.called)
      assert.notOk(b_run.called)
      p.run()
      assert.ok(a_run.calledOnce)
      assert.ok(b_run.calledOnce)
    })

    it('ends elements in parallel', () => {
      let a_end = sinon.spy()
      let b_end = sinon.spy()
      a.on('end', a_end)
      b.on('end', b_end)

      p.prepare()
      p.run()
      assert.notOk(a_end.called)
      assert.notOk(b_end.called)
      p.end()
      assert.ok(a_end.calledOnce)
      assert.ok(b_end.calledOnce)
    })

    it('implements race mode (by default)', () => {
      let b_end = sinon.spy()
      b.on('end', b_end)
      let p_end = sinon.spy()
      p.on('end', p_end)

      p.prepare()
      let output =  p.run().then(() => {
        assert.ok(b_end.calledOnce)
        assert.ok(p_end.calledOnce)
      })

      assert.notOk(b_end.called)
      a.end()

      return output
    })

    it('implements no-element-left-behind mode (mode=all)', () => {
      p.mode = 'all'
      let p_end = sinon.spy()
      p.on('end', p_end)

      p.prepare()

      let output = p.run()

      a.end()
      assert.notOk(p_end.called)
      b.end()

      return output.then(() => {
        assert.ok(p_end.calledOnce)
      })
    })

  })

})
