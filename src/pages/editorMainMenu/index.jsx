import React, { useState, useEffect } from 'react';
import gql from 'graphql-tag';
import { useQuery, useMutation } from '@apollo/react-hooks';
import cx from 'classnames';
import moment from 'moment';
import ObjectID from 'utils/ObjectID';

import { Spinner } from "baseui/spinner";
import DeleteAlt from 'baseui/icon/delete-alt'
import HeaderBar from 'components/headerBar';
import s from './styles.module.scss';

const GET_USER_EDITOR = gql`
  query getUserEditor {
    me {
      posts {
        _id
        title
        content
        date
        content
      }
      drafts {
        _id
        title
        date
        content
      }
    }
  }
`

const CREATE_DRAFT = gql`
  mutation CreateDraft(
    $title: String
    $content: String
    $_id: ID!
  ) {
    createDraft(
      title: $title
      content: $content
      _id: $_id
    ) {
      _id
      title
      date
    }
  }
`

const DELETE_DRAFT = gql`
  mutation deleteDraft(
    $_id: ID!
  ) {
    deleteDraft(
      _id: $_id
    ) {
      _id
      name
      email
      drafts {
        _id
      }
    }
  }
`

const EditorMainMenu = ({ history }) => {
  const { data, error, client } = useQuery(GET_USER_EDITOR);

  const [ createDraft, { loading: creatingDraft }] = useMutation(CREATE_DRAFT, {
    update(cache, { data: { createDraft } }) {
      console.log(createDraft)
      cache.writeData({ data: {
        me: {
          ...data.me,
          drafts: data.me.drafts.concat([createDraft])
        }
      }})
    }
  })

  const [ deleteDraft ] = useMutation(DELETE_DRAFT)
  
  useEffect(() => {
    //console.log(data);
  })

  const createPost = async () => {
    try {
      const _id = ObjectID();
      await createDraft({ variables: { _id }});

      history.push(`/editor/draft/${_id}`)
    } catch (error) {
      console.log(error.message)
    }
  }

  const deleteItem = async ({ _id, isDraft }) => {
    try {
      if (isDraft) {
        client.writeData({
          data: {
            me: {
              ...data.me,
              drafts: data.me.drafts.filter(item => item._id !== _id),
            }
          }
        });

        await deleteDraft({ variables: { _id }});
      } else {
        client.writeData({
          data: {
            me: {
              ...data.me,
              posts: data.me.posts.filter(item => item._id !== _id),
            }
          }
        });
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  const Post = ({ item, isDraft }) => {
    return (
      <div className={s.card} onClick={() => history.push(`/editor/draft/${item._id}`)}>
        <div className={s.top}>
          <div className={s.date}>{moment(item.date, 'x').format("DD-MM-YYYY")}</div>
          <div className={s.delete} onClick={() => deleteItem({ _id: item._id, isDraft })}><DeleteAlt /></div>
        </div>
        <h4>{item.title}</h4>
      </div>
    )
  }

  return (
    <div>
        <HeaderBar />
        {data &&
          <div className={s.content}>
            <div className={s.postsWrapper}>
              <h3>Drafts</h3>
              <div className={s.posts}>
                <div onClick={createPost} className={cx({ [s.card]: true, [s.newPost]: true })}>
                  {creatingDraft ? <Spinner color="  #e2e2e2" size={80}/> : '+' }
                </div>
                {[...data.me.drafts].reverse().map((item) => <Post key={item._id} item={item} isDraft={true}/> )}
              </div>
            </div>
            <div className={s.postsWrapper}>
              <h3>Posts</h3>
              <div className={s.posts}>
                {[...data.me.posts].reverse().map((item) => <Post key={item._id} item={item} isDraft={false}/> )}
              </div>
            </div>
          </div>
        }
    </div>
  )
}

export default EditorMainMenu;
