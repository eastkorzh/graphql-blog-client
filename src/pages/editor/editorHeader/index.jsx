import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/react-hooks';

import { Avatar } from "baseui/avatar";
import ArrowLeft from 'baseui/icon/arrow-left'
import { Button } from "baseui/button";
import { toaster, ToasterContainer, PLACEMENT } from "baseui/toast";
import s from './styles.module.scss';
import gql from 'graphql-tag';

const PUBLISH_DRAFT = gql`
  mutation publishDraft(
    $_id: ID!
  ) {
    publishDraft(
      _id: $_id
    ) {
      _id
      drafts {
        _id
        title
        content
        cover
      }
      posts {
        _id
        title
        content
        cover
      }
    }
  }
`
const GET_DRAFT_AUTHOR = gql`
  query draftAuthor($_id: ID!) {
    draft(_id: $_id) {
      _id
      author {
        _id
        email
        name
        avatar
      }
    }
  }
`
const GET_POST_AUTHOR = gql`
  query postAuthor($_id: ID!) {
    post(_id: $_id) {
      _id
      author {
        _id
        name
        email
        avatar
      }
    }
  }
`
const GET_LOGGED_USER = gql`
  query getLoggedUser {
    me {
      _id
    }
  }
`

const EditorHeader = ({ match, history }) => {
  const [ isAuthor, setIsAuthor ] = useState(false);
  const [ author, setAuthor ] = useState(null);

  const [ publishDraft ] = useMutation(PUBLISH_DRAFT)
  //   , {
  //   update(cache, { data: publishDraft }) {
  //     console.log(publishDraft)
  //     cache.writeData({ data: {
  //       me: {
  //         ...publishDraft,
  //       }
  //     }})
  //   }
  // });

  const [ getDraftAuthor ] = useLazyQuery(GET_DRAFT_AUTHOR, {
    onCompleted({ draft }) {
      if (draft) {
        setAuthor(draft.author)
        setIsAuthor(draft.author._id === loggedUser.me._id)
      }
    }
  });
  const [ getPostAuthor ] = useLazyQuery(GET_POST_AUTHOR, {
    onCompleted({ post }) {
      if (post) {
        setAuthor(post.author)
        setIsAuthor(post.author._id === loggedUser.me._id)
      }
    }
  });
  const { data: loggedUser } = useQuery(GET_LOGGED_USER, {
    onCompleted() {
      if (match.path === '/editor/post/:id') {
        getPostAuthor({ variables: {
          _id: match.params.id,
        }})
      }
      if (match.path === '/editor/draft/:id') {
        getDraftAuthor({ variables: {
          _id: match.params.id,
        }})
      }
    }
  });

  // const [ getUser ] = useLazyQuery(GET_LOGGED_USER, {
  //   onCompleted({ me }) {
  //     if (me) {
  //       setIsAuthor(me.email === author.draft.author.email)
  //     }
  //   }
  // });
  // const { data: author } = useQuery(GET_DRAFT_AUTHOR, {
  //   variables: {
  //     _id: match.params.id
  //   }, 
  //   onCompleted() {
  //     getUser()
  //   }
  // });

  // useEffect(() => {
  //   console.log(author)
  // })

  const handlePublish = async () => {
    try {
      await publishDraft({ variables: { _id: match.params.id } });
      history.push(`/editor/post/${match.params.id}`)
    } catch (error) {
      toaster.negative(error.message)
    }
  }

  return (
    <ToasterContainer placement={PLACEMENT.bottomRight} >
      <div className={s.container}>
        <div className={s.left}>
          <div className={s.back} onClick={() => history.push('/editor')}>
            <ArrowLeft size={50}/>
          </div>
          {author &&
            <div className={s.author}>
              <Avatar size={'50px'} name={author.name} src={author.avatar} />
              <div className={s.name}>{author.name}</div>
            </div>
          }
        </div>
        {isAuthor && match.path === "/editor/draft/:id" ? 
          <Button
            onClick={handlePublish}
            overrides={{
              BaseButton: {
                style: {
                  height: '30px',
                  paddingTop: '5px',
                  paddingRight: '10px',
                  paddingBottom: '5px',
                  paddingLeft: '10px',
                }
              }
            }}
          >
            Publish
          </Button> : 
          <Button
            onClick={() => alert("click")}
            overrides={{
              BaseButton: {
                style: {
                  height: '30px',
                  paddingTop: '5px',
                  paddingRight: '10px',
                  paddingBottom: '5px',
                  paddingLeft: '10px',
                }
              }
            }}
          >
            Edit
          </Button>
        }
      </div> 
    </ToasterContainer>
  )
}

export default EditorHeader;
